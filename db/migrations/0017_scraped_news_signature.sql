-- LLM-extracted event signature (JSON) used to block/cluster articles into topics.
ALTER TABLE scraped_news ADD COLUMN signature TEXT;
