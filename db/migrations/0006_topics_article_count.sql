-- Add article_count column to topics (default 0)
ALTER TABLE topics ADD COLUMN article_count INTEGER NOT NULL DEFAULT 0;

-- Backfill counts from existing scraped_news assignments
UPDATE topics
SET article_count = (
  SELECT COUNT(*) FROM scraped_news WHERE scraped_news.topic_id = topics.id
);
