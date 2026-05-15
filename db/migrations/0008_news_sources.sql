CREATE TABLE IF NOT EXISTS news_sources (
  key TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  metadata TEXT NOT NULL DEFAULT '{}'
);

-- Seed both sources as enabled
INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'rt',
  'RT Arabic',
  'RT عربي',
  'https://arabic.rt.com',
  1,
  '{"logoUrl":"https://upload.wikimedia.org/wikipedia/commons/a/a0/Russia-today-logo.svg","country":"روسيا","language":"العربية"}'
);

INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'independent',
  'Independent Arabia',
  'إندبندنت عربية',
  'https://www.independentarabia.com',
  1,
  '{"logoUrl":"https://www.arabnews.com/sites/default/files/styles/n_670_395/public/main-image/2019/01/24/1440086-2029066319.png?itok=vorhEkyF","country":"المملكة المتحدة","language":"العربية"}'
);
