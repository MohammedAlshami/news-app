# AI Generation Pipeline

All AI calls go through OpenRouter.

## Model configuration

[`lib/openrouter.ts`](../lib/openrouter.ts):

```ts
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash"
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ""
```

- Production model is pinned via the `OPENROUTER_MODEL` **var** in `wrangler.toml`
  (`deepseek/deepseek-v4-flash`, the cheapest DeepSeek option).
- No `provider` preference is sent — OpenRouter chooses the upstream provider.
- The API key is a Worker **secret** (`OPENROUTER_API_KEY`).

## Stages

```
scraped_news ──► topic grouping ──► topics (+category)
                      │
                      ├─► runWriter (write-pipeline) ──► generated_articles + articles
                      └─► batch-generate ──────────────► generated_articles + articles
```

### 1. Topic grouping — `lib/topic-grouper.ts` + `lib/db-topics.server.ts`

`runTopicGrouping()` (in `lib/db-topics.server.ts`) takes scraped items from the last 24h,
calls `groupArticlesByTopic(...)`, then inserts/reuses `topics` and links `scraped_news.topic_id`.

`groupArticlesByTopic`:

1. Buckets articles by **source-native category** (`scraped_news.category`).
2. Maps the source category to a site category via `SOURCE_TO_SITE_CATEGORY`:
   - direct: `business/economy/finance → economy`, `sport(s) → sports`, `tech(nology) → technology`,
     `politics → politics`, `health → health`, `culture/arts/art → culture`, `science → science`,
     `environment/climate → environment`;
   - everything else (`world`, `news`, `middle_east`, `arab`, …) → **`mixed`**.
3. For `mixed`, each article is classified by `batchClassifyArticles` (LLM) into one of the
   site categories; articles are grouped by the returned slug.
4. `groupArticles` (LLM) clusters same-category articles into topics with an Arabic title.
5. Each group carries a `categoryId` (from the slug) which becomes `topics.category_id`.

**Reuse re-sync:** when `runTopicGrouping` reuses an existing topic (via `findMatchingTopic`),
it now updates that topic's `category_id` to the freshly classified group's category
(`lib/db-topics.server.ts`), so old mislabels self-correct.

### 2. Article writer — `lib/writer.ts`

`runWriter()` (driven by `write-pipeline`) generates **one** article per run:

- Selects candidate topics with no generated article, `isActive`, non-null category, ordered by `articleCount`, limit 200.
- **Category-balanced:** groups candidates by category and iterates categories ordered by **remaining daily quota** (so technology/science/environment aren't starved by sports/politics).
- **Source rule:** requires **≥1** source with `content` and **≥1** image (single-source topics allowed).
- Skips topics whose category has no remaining quota.
- Calls the LLM (`WRITE_PROMPT`) for title/excerpt/paragraphs/highlights, dedups titles (`isDuplicateTitle`), uploads the cover to R2 (`uploadCoverWithDedup`), and inserts into `generated_articles` + `articles`.

### 3. Batch generator — `app/api/cron/batch-generate/route.ts`

SSE endpoint (called by `news-latest` on the hour). Query: `?limit=N` (default 60).

1. `classifyAllTopics()` — assigns categories to topics with `categoryId = null`.
   - Uses a **described prompt returning slugs** (mapped to IDs server-side), chunked (25/request) with a 45s timeout per chunk so it can't hang the run.
2. Loads per-category quotas (`getCategoryQuotas`) and unprocessed topics.
3. **Round-robins across categories**, generating only while the category has remaining daily quota, up to `limit`, with concurrency 4.
4. `generateArticleForTopic()` requires an image; calls the LLM; dedups titles; uploads the cover; inserts `generated_articles` (published) + `articles` (published, with the topic's `categoryId`).

### 4. Standalone generator — `lib/article-generator.ts`

`generateArticleFromSources(topic, sources)` is the single-call generator used by
`generateAndSaveArticleForTopic` (admin "generate" modal, `/api/cron/generate-articles`).
It builds a Tiptap JSON body from the returned paragraphs and requires at least one source image.

## Daily quotas (per category)

- Stored on `categories.daily_quota` (migration `0014`), default 25.
- [`lib/db-generation-quota.server.ts`](../lib/db-generation-quota.server.ts):
  - `getCategoryQuotas()` → per-category `dailyQuota`, `generatedToday` (UTC), `remaining`.
  - `updateCategoryQuotas()`.
- Enforced by both `runWriter` and `batch-generate`.
- Edited in the admin at **`/admin/settings`** (`app/admin/settings/`, `components/admin-category-quotas-form.tsx`).
- The scheduler fills categories up to their quota each day.

## Images

- `uploadCoverWithDedup(sourceUrl, ownerId)` (`lib/upload-image-dedup.server.ts`):
  - dedups by source URL and by sha256 hash (`images` table),
  - uploads to R2 via the `MEDIA` binding (`lib/r2.server.ts`),
  - returns the public URL (`R2_PUBLIC_URL`).
- `deleteStoredImageIfR2` removes R2 objects.

## Dedup

- Title similarity: `isDuplicateTitle` (`lib/article-dedup.server.ts`).
- Topic matching on reuse: `findMatchingTopic` (shared keywords ≥ 2).
- Image dedup: `images` table (source URL + hash).

## Categorization note (historical fix)

In August the classifier misfiled a large share of "mixed" source topics (e.g. world/politics
into `environment`/`culture`). A one-off re-classification of the **353 topics that had
published articles** corrected **68 topics** (e.g. `environment → politics` ×18), and both
`topics.category_id` and `articles.category_id` were updated. The pipeline hardening above
(described prompt + reuse re-sync) prevents recurrence.

## Cost

- Model `deepseek/deepseek-v4-flash` ≈ `$0.036 / $0.071` per 1M input/output tokens.
- Each article involves classification + (optional) grouping + generation calls.
- There is no provider preference, so OpenRouter may route to a pricier provider; watch key spend.
