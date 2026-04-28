CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  category_id TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS site_ads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  href TEXT NOT NULL DEFAULT '#',
  show_on_home INTEGER NOT NULL DEFAULT 1,
  show_on_article INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  tier TEXT NOT NULL DEFAULT 'standard',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS advertise_inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

DELETE FROM categories;
DELETE FROM users;
DELETE FROM articles;
DELETE FROM site_ads;
DELETE FROM advertise_inquiries;

INSERT INTO categories (id, name, description, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'تكنولوجيا', 'أخبار التقنية والذكاء الاصطناعي والأجهزة', 1745888400000),
  ('22222222-2222-2222-2222-222222222222', 'سياسة', 'متابعة الأحداث السياسية والتحليلات', 1745888400000),
  ('33333333-3333-3333-3333-333333333333', 'رياضة', 'الرياضة المحلية والعالمية والبطولات', 1745888400000),
  ('44444444-4444-4444-4444-444444444444', 'اقتصاد', 'الأسواق والمال والأعمال', 1745888400000);

INSERT INTO users (id, email, name, role, created_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'admin@example.com',
  'مدير الأخبار',
  'admin',
  1745888400000
);

INSERT INTO articles (
  id, title, excerpt, body, views, category_id, is_published, cover_image_url, created_at, updated_at
) VALUES
  (
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    'الذكاء الاصطناعي يغيّر شكل غرف الأخبار',
    'كيف أصبح الذكاء الاصطناعي جزءًا من تحرير الأخبار والتدقيق السريع.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"نص تجريبي عربي حول الذكاء الاصطناعي في غرف الأخبار."}]}]}',
    0,
    '11111111-1111-1111-1111-111111111111',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'aaaa2222-aaaa-2222-aaaa-222222222222',
    'الجيل الجديد من الهواتف الذكية يصل إلى الأسواق',
    'إطلاقات مرتقبة ومواصفات أقوى وبطاريات أطول عمرًا.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"تفاصيل إطلاقات الهواتف الجديدة."}]}]}',
    0,
    '11111111-1111-1111-1111-111111111111',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'bbbb1111-bbbb-1111-bbbb-111111111111',
    'قمة إقليمية تبحث ملفات الأمن والطاقة',
    'اجتماعات مكثفة بين القادة لمناقشة ملفات اقتصادية وسياسية.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"تحليل عربي حول القمة الإقليمية."}]}]}',
    0,
    '22222222-2222-2222-2222-222222222222',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'bbbb2222-bbbb-2222-bbbb-222222222222',
    'نتائج أولية تشير إلى تقارب واضح بين المرشحين',
    'المشهد الانتخابي يزداد سخونة مع اقتراب إعلان النتائج النهائية.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"مقال سياسي تجريبي."}]}]}',
    0,
    '22222222-2222-2222-2222-222222222222',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'cccc1111-cccc-1111-cccc-111111111111',
    'المنتخب الوطني يستعد للمواجهة الحاسمة',
    'تدريبات مكثفة وتركيز عالٍ قبل المباراة المرتقبة.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"مقال رياضي عربي تجريبي."}]}]}',
    0,
    '33333333-3333-3333-3333-333333333333',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'cccc2222-cccc-2222-cccc-222222222222',
    'نهائي دوري الأبطال يقترب وسط ترقب جماهيري',
    'المدرجات ممتلئة والحماس في أعلى درجاته قبل صافرة البداية.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"أخبار رياضية حول النهائي."}]}]}',
    0,
    '33333333-3333-3333-3333-333333333333',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'dddd1111-dddd-1111-dddd-111111111111',
    'مؤشرات السوق ترتفع بدعم من قطاع التقنية',
    'الأسواق المالية تشهد تحسنًا تدريجيًا في جلسة اليوم.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"مقال اقتصادي عربي تجريبي."}]}]}',
    0,
    '44444444-4444-4444-4444-444444444444',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  ),
  (
    'dddd2222-dddd-2222-dddd-222222222222',
    'توقعات بنمو الاستثمار في الشركات الناشئة',
    'تمويلات جديدة تدعم توسع المشاريع المحلية.',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"خبر اقتصادي آخر."}]}]}',
    0,
    '44444444-4444-4444-4444-444444444444',
    1,
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    1745888400000,
    1745888400000
  );

INSERT INTO site_ads (
  id, name, image_url, href, show_on_home, show_on_article, is_active, tier, created_at, updated_at
) VALUES
  (
    'eeee1111-eeee-1111-eeee-111111111111',
    'إعلان رئيسي',
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    'https://example.com',
    1,
    1,
    1,
    'premium',
    1745888400000,
    1745888400000
  ),
  (
    'eeee2222-eeee-2222-eeee-222222222222',
    'إعلان جانبي',
    'https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg',
    'https://example.com',
    1,
    1,
    1,
    'standard',
    1745888400000,
    1745888400000
  );

INSERT INTO advertise_inquiries (
  id, name, email, phone, company, message, status, admin_notes, created_at, updated_at
) VALUES (
  'ffff1111-ffff-1111-ffff-111111111111',
  'عميل تجريبي',
  'contact@example.com',
  NULL,
  'شركة تجريبية',
  'مهتم بوضع إعلان في الموقع.',
  'new',
  NULL,
  1745888400000,
  1745888400000
);
