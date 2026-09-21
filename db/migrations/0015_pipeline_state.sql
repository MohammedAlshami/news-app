-- Pipeline state, freshness and indexes (no schema objects are dropped).

-- 1. New columns -------------------------------------------------------------
ALTER TABLE scraped_news ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE scraped_news ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scraped_news ADD COLUMN published_ts INTEGER;
ALTER TABLE scraped_news ADD COLUMN claimed_at INTEGER;

ALTER TABLE topics ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE topics ADD COLUMN last_seen_at INTEGER;
ALTER TABLE topics ADD COLUMN gen_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE topics ADD COLUMN claimed_at INTEGER;
ALTER TABLE topics ADD COLUMN written_source_count INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill ----------------------------------------------------------------
-- published_ts: ISO-looking values parsed (timezone offset ignored, fine for backfill),
-- everything else falls back to scraped_at. Never later than scraped_at.
UPDATE scraped_news
SET published_ts = MIN(
  scraped_at,
  COALESCE(
    CASE WHEN published_at GLOB '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]*'
      THEN CAST(strftime('%s', substr(published_at, 1, 19)) AS INTEGER) * 1000
    END,
    scraped_at
  )
)
WHERE published_ts IS NULL;

-- Already-grouped rows are done; ungrouped rows older than 72h are expired.
-- Only ungrouped rows inside the 72h window stay 'pending' and will be clustered.
UPDATE scraped_news SET status = 'clustered' WHERE topic_id IS NOT NULL;
UPDATE scraped_news
SET status = 'skipped'
WHERE topic_id IS NULL
  AND published_ts < (CAST(strftime('%s', 'now') AS INTEGER) - 72 * 3600) * 1000;

UPDATE topics SET last_seen_at = updated_at WHERE last_seen_at IS NULL;
UPDATE topics
SET status = 'written',
    written_source_count = (SELECT count(*) FROM scraped_news s WHERE s.topic_id = topics.id)
WHERE id IN (SELECT topic_id FROM generated_articles WHERE topic_id IS NOT NULL);

-- 3. Remove the single duplicate (source_key, url) pair, then enforce uniqueness ----
DELETE FROM scraped_news
WHERE rowid NOT IN (SELECT MIN(rowid) FROM scraped_news GROUP BY source_key, url);

CREATE UNIQUE INDEX IF NOT EXISTS scraped_news_source_url_uq ON scraped_news(source_key, url);

-- 4. Indexes ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS scraped_news_topic_idx ON scraped_news(topic_id);
CREATE INDEX IF NOT EXISTS scraped_news_status_pub_idx ON scraped_news(status, published_ts);
CREATE INDEX IF NOT EXISTS scraped_news_published_ts_idx ON scraped_news(published_ts);
CREATE INDEX IF NOT EXISTS topics_status_seen_idx ON topics(status, last_seen_at);
CREATE INDEX IF NOT EXISTS topics_category_idx ON topics(category_id);
CREATE INDEX IF NOT EXISTS generated_articles_topic_idx ON generated_articles(topic_id);
CREATE INDEX IF NOT EXISTS generated_articles_created_idx ON generated_articles(created_at);
CREATE INDEX IF NOT EXISTS articles_created_idx ON articles(created_at);
CREATE INDEX IF NOT EXISTS articles_category_created_idx ON articles(category_id, created_at);
