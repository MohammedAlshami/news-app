-- Seed Sky News Arabia source
INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'skynews',
  'Sky News Arabia',
  'سكاي نيوز عربية',
  'https://www.skynewsarabia.com',
  1,
  '{"logoUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Sky_News_Arabia_logo.svg/1200px-Sky_News_Arabia_logo.svg.png","country":"الإمارات العربية المتحدة","language":"العربية"}'
);
