-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Add topic_id FK to scraped_news
ALTER TABLE scraped_news ADD COLUMN topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scraped_news_topic_idx ON scraped_news(topic_id);
