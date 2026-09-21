-- One-off data cleanup (run once, after 0015).
-- Recompute the corrupted article_count from real linked rows, then delete topics that
-- have no sources, no generated article and no children.
UPDATE topics SET article_count = (SELECT count(*) FROM scraped_news s WHERE s.topic_id = topics.id);

DELETE FROM topics
WHERE article_count = 0
  AND id NOT IN (SELECT topic_id FROM generated_articles WHERE topic_id IS NOT NULL)
  AND id NOT IN (SELECT parent_id FROM topics WHERE parent_id IS NOT NULL);
