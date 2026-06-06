-- Seed additional news sources
INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'youm7',
  'Youm7',
  'اليوم السابع',
  'https://www.youm7.com',
  1,
  '{"logoUrl":"https://img.youm7.com/images/graphics/logoyoum7.png","country":"مصر","language":"العربية"}'
);

INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'bbc',
  'BBC Arabic',
  'بي بي سي عربي',
  'https://www.bbc.com/arabic',
  1,
  '{"logoUrl":"https://www.bbc.com/favicon.ico","country":"المملكة المتحدة","language":"العربية"}'
);

INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'alquds',
  'Al Quds',
  'جريدة القدس',
  'https://www.alquds.com',
  1,
  '{"logoUrl":"https://cdn.alquds.com/uploads/4736cd20e20d0f66e2edcc94a8e4d6e5.png","country":"فلسطين","language":"العربية"}'
);

INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'elwatan',
  'El Watan News',
  'الوطن',
  'https://www.elwatannews.com',
  1,
  '{"logoUrl":"https://www.elwatannews.com/assets/images/logo_elwatannews.jpeg","country":"مصر","language":"العربية"}'
);

INSERT OR IGNORE INTO news_sources (key, name, name_ar, url, is_enabled, metadata) VALUES (
  'alaraby',
  'Al Araby Al Jadeed',
  'العربي الجديد',
  'https://www.aajeg.com',
  1,
  '{"logoUrl":"https://www.aajeg.com/themes/custom/alaraby_revamp/logo.svg","country":"المملكة المتحدة","language":"العربية"}'
);
