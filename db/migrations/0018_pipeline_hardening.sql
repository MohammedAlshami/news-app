-- Pipeline hardening (ADDITIVE ONLY: the old code keeps working on the same DB until redeployed).
-- Order matters for D1's CPU limit: tables + columns (metadata only), then indexes, then one tiny, index-ranged backfill.

-- 1. Key/value state, run leases and kill switch ---------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_state (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  holder TEXT,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- 2. One row per executed pipeline step (admin health view) ----------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY NOT NULL,
  step TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  ok INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  summary TEXT NOT NULL DEFAULT '{}'
);

-- 3. New nullable / defaulted columns -------------------------------------------------------------
ALTER TABLE articles ADD COLUMN image_urls TEXT;
ALTER TABLE topics ADD COLUMN claim_token TEXT;
ALTER TABLE topics ADD COLUMN pre_claim_status TEXT;
ALTER TABLE topics ADD COLUMN skip_reason TEXT;

ALTER TABLE scraped_news ADD COLUMN content_len INTEGER;
ALTER TABLE scraped_news ADD COLUMN date_unknown INTEGER NOT NULL DEFAULT 0;

ALTER TABLE generated_articles ADD COLUMN article_id TEXT;
ALTER TABLE generated_articles ADD COLUMN update_of TEXT;
ALTER TABLE generated_articles ADD COLUMN kind TEXT NOT NULL DEFAULT 'original';
ALTER TABLE generated_articles ADD COLUMN model TEXT;
ALTER TABLE generated_articles ADD COLUMN prompt_version TEXT;
ALTER TABLE generated_articles ADD COLUMN prompt_tokens INTEGER;
ALTER TABLE generated_articles ADD COLUMN completion_tokens INTEGER;
ALTER TABLE generated_articles ADD COLUMN reasoning_tokens INTEGER;
ALTER TABLE generated_articles ADD COLUMN event_sig TEXT;
ALTER TABLE generated_articles ADD COLUMN gate_flags TEXT;

-- 4. Indexes (partial where possible: they stay tiny and cheap to build) ---------------------------
CREATE INDEX IF NOT EXISTS topics_claimed_idx ON topics(claimed_at) WHERE claimed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS topics_status_attempts_idx ON topics(status, gen_attempts);
CREATE INDEX IF NOT EXISTS scraped_news_claimed_idx ON scraped_news(claimed_at) WHERE claimed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS scraped_news_scraped_at_idx ON scraped_news(scraped_at);
CREATE INDEX IF NOT EXISTS generated_articles_published_idx ON generated_articles(is_published, created_at);
CREATE INDEX IF NOT EXISTS articles_published_created_idx ON articles(is_published, created_at);
CREATE INDEX IF NOT EXISTS pipeline_runs_started_idx ON pipeline_runs(started_at);
CREATE INDEX IF NOT EXISTS pipeline_runs_step_idx ON pipeline_runs(step, started_at);

-- 5. Backfill: only rows inside the 72h clustering window (uses scraped_news_published_ts_idx) ------
UPDATE scraped_news
SET content_len = length(content)
WHERE content IS NOT NULL
  AND content_len IS NULL
  AND published_ts >= (CAST(strftime('%s', 'now') AS INTEGER) - 72 * 3600) * 1000;
