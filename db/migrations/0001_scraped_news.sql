CREATE TABLE IF NOT EXISTS scraped_news (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  category TEXT NOT NULL,
  query TEXT,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  image_url TEXT,
  published_at TEXT,
  scraped_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  raw_json TEXT NOT NULL
);
