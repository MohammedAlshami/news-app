ALTER TABLE categories ADD COLUMN slug TEXT;

UPDATE categories SET slug = 'technology' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE categories SET slug = 'politics' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE categories SET slug = 'sports' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE categories SET slug = 'economy' WHERE id = '44444444-4444-4444-4444-444444444444';

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON categories(slug);

UPDATE categories SET slug = id WHERE slug IS NULL OR slug = '';
