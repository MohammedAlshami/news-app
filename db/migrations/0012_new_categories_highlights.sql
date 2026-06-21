-- Add missing categories: Health, Culture & Arts, Science, Environment
INSERT OR IGNORE INTO categories (id, name, slug, description, created_at) VALUES
  ('55555555-5555-5555-5555-555555555555', 'صحة', 'health', 'أخبار الصحة والطب والوقاية', 1745888400000),
  ('66666666-6666-6666-6666-666666666666', 'ثقافة وفنون', 'culture', 'أخبار الثقافة والفنون والسينما والأدب', 1745888400000),
  ('77777777-7777-7777-7777-777777777777', 'علوم', 'science', 'أخبار العلوم والبحوث والفضاء', 1745888400000),
  ('88888888-8888-8888-8888-888888888888', 'بيئة', 'environment', 'أخبار البيئة والمناخ والطبيعة', 1745888400000);

-- Add highlights column to articles table
ALTER TABLE articles ADD COLUMN highlights TEXT NOT NULL DEFAULT '[]';

-- Add highlights column to generated_articles table
ALTER TABLE generated_articles ADD COLUMN highlights TEXT NOT NULL DEFAULT '[]';

-- Add original_image_url column to articles table
ALTER TABLE articles ADD COLUMN original_cover_image_url TEXT;

-- Add image_hash column to articles table
ALTER TABLE articles ADD COLUMN cover_image_hash TEXT;

-- Add original_image_url column to generated_articles table
ALTER TABLE generated_articles ADD COLUMN original_cover_image_url TEXT;
