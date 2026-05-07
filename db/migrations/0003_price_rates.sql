CREATE TABLE IF NOT EXISTS price_rates (
  id TEXT PRIMARY KEY NOT NULL,
  market TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  sell_rate REAL NOT NULL,
  buy_rate REAL NOT NULL,
  scraped_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  source_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS price_rates_market_idx ON price_rates(market);
CREATE INDEX IF NOT EXISTS price_rates_currency_idx ON price_rates(currency_code);
CREATE INDEX IF NOT EXISTS price_rates_scraped_idx ON price_rates(scraped_at);
