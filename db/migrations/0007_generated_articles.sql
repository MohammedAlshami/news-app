-- Add updatedAt to topics (constant default required for ALTER TABLE in SQLite)
ALTER TABLE topics ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
UPDATE topics SET updated_at = created_at WHERE updated_at = 0;

-- Create generated_articles table
CREATE TABLE IF NOT EXISTS generated_articles (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  cover_image_url TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]',
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  source_article_ids TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS generated_articles_topic_idx ON generated_articles(topic_id);
CREATE INDEX IF NOT EXISTS generated_articles_created_idx ON generated_articles(created_at);
