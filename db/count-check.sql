SELECT 'categories' AS table_name, COUNT(*) AS count FROM categories
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'articles', COUNT(*) FROM articles
UNION ALL SELECT 'site_ads', COUNT(*) FROM site_ads
UNION ALL SELECT 'advertise_inquiries', COUNT(*) FROM advertise_inquiries;
