/**
 * Uses OpenRouter (OpenAI-compatible) to generate a full Arabic news article
 * from a set of scraped source articles belonging to a single topic.
 *
 * Returns a structured JSON object with title, excerpt, and body (Tiptap JSON).
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

export type SourceArticleInput = {
  id: string
  title: string
  excerpt: string
  content?: string | null
  url: string
  source: string
  imageUrl?: string | null
}

export type GeneratedArticleOutput = {
  title: string
  excerpt: string
  /** Tiptap-compatible JSON doc as a string */
  body: string
  /** 3-5 bullet-point highlights */
  highlights: string[]
  /** First non-null imageUrl from sources, used as cover */
  coverImageUrl: string | null
  /** Original cover image URL before R2 upload */
  originalCoverImageUrl: string | null
  /** All non-null imageUrls from sources */
  imageUrls: string[]
  sourceArticleIds: string[]
}

const SYSTEM_PROMPT = `
You are a professional Arabic news journalist. You will receive a JSON object with:
- "topic": the topic title in Arabic
- "sources": array of { id, title, excerpt, content, url, source }

Your job:
1. Write a comprehensive, well-structured Arabic news article that synthesises all the source material.
2. The article should be objective, informative, and written in Modern Standard Arabic (فصحى).
3. Structure the body as multiple paragraphs covering different angles of the story.
4. Attribute information to sources naturally within the text.
5. Generate 3-5 bullet-point highlights that summarize the most important takeaways.

IMPORTANT: The "paragraphs" array must contain ONLY flowing prose paragraphs. Do NOT include any "أبرز النقاط", "ملخص", "الخلاصة", bullet lists, numbered lists, or summary sections inside the paragraphs. These will be displayed separately from the article body.

Respond with ONLY valid JSON matching this exact shape — no markdown, no explanation:
{
  "title": "<concise Arabic headline, 8-15 words>",
  "excerpt": "<2-3 sentence Arabic summary, 40-80 words>",
  "paragraphs": ["<paragraph 1>", "<paragraph 2>", "<paragraph 3>", ...],
  "highlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>", ...]
}

Requirements:
- At least 4 paragraphs
- Each paragraph 50-120 words
- Title must be a proper news headline
- Excerpt must stand alone as a summary
- Highlights must be 3-5 concise bullet points (10-25 words each)
`.trim()

export async function generateArticleFromSources(
  topic: string,
  sources: SourceArticleInput[],
): Promise<GeneratedArticleOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.")
  }

  if (sources.length === 0) {
    throw new Error("No source articles provided for generation.")
  }

  const userMessage = JSON.stringify({
    topic,
    sources: sources.map((s) => ({
      id: s.id,
      title: s.title,
      excerpt: s.excerpt,
      content: s.content ?? null,
      url: s.url,
      source: s.source,
    })),
  })

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-title": "News Article Generator",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter article generation failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const raw = data.choices?.[0]?.message?.content ?? ""

  let parsed: { title: string; excerpt: string; paragraphs: string[]; highlights?: string[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Article generator returned invalid JSON: ${raw.slice(0, 300)}`)
  }

  if (!parsed.title || !parsed.excerpt || !Array.isArray(parsed.paragraphs)) {
    throw new Error(`Article generator response missing required fields: ${raw.slice(0, 300)}`)
  }

  // Require at least one source with an image — no fallback
  const imageUrls = sources
    .map((s) => s.imageUrl)
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)

  if (imageUrls.length === 0) {
    throw new Error(`Cannot generate article without any source images for topic: ${topic}`)
  }

  // Strip any embedded highlight/summary sections from paragraphs
  const paragraphs = parsed.paragraphs.filter((p) => {
    const trimmed = p.trim()
    if (/^أبرز النقاط/.test(trimmed)) return false
    if (/^ملخص/.test(trimmed)) return false
    if (/^الخلاصة/.test(trimmed)) return false
    return true
  })

  // Build Tiptap JSON body from paragraphs
  const body = JSON.stringify({
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  })

  const highlights = Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : []

  return {
    title: parsed.title,
    excerpt: parsed.excerpt,
    body,
    highlights,
    coverImageUrl: imageUrls[0],
    originalCoverImageUrl: imageUrls[0],
    imageUrls,
    sourceArticleIds: sources.map((s) => s.id),
  }
}
