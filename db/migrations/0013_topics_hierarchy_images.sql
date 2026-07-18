-- Add parent-child topic hierarchy
ALTER TABLE topics ADD COLUMN parent_id TEXT REFERENCES topics(id);
ALTER TABLE topics ADD COLUMN type TEXT NOT NULL DEFAULT 'event';
ALTER TABLE topics ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE topics ADD COLUMN start_date TEXT;
ALTER TABLE topics ADD COLUMN end_date TEXT;

-- Images table for dedup
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  r2_url TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  first_used_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  usage_count INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
