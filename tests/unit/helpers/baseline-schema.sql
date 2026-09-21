-- Production D1 schema BEFORE migration 0015 (dumped from sqlite_master). Test baseline only.

CREATE TABLE advertise_inquiries (
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

CREATE TABLE articles (
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
, is_member_only INTEGER NOT NULL DEFAULT 0, highlights TEXT NOT NULL DEFAULT '[]', original_cover_image_url TEXT, cover_image_hash TEXT);

CREATE TABLE "categories" (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
, daily_quota integer NOT NULL DEFAULT 25);

CREATE TABLE finance_revenue (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('google_ads', 'memberships', 'paid_articles', 'direct_ads')),
      amount REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

CREATE TABLE "generated_articles" (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`cover_image_url` text,
	`original_cover_image_url` text,
	`image_urls` text DEFAULT '[]' NOT NULL,
	`highlights` text DEFAULT '[]' NOT NULL,
	`topic_id` text,
	`source_article_ids` text DEFAULT '[]' NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE images (
  id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  r2_url TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  first_used_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  usage_count INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE news_sources (
  key TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE "price_rates" (
	`id` text PRIMARY KEY NOT NULL,
	`market` text NOT NULL,
	`asset_type` text NOT NULL,
	`currency_code` text NOT NULL,
	`currency_name` text NOT NULL,
	`sell_rate` integer NOT NULL,
	`buy_rate` integer NOT NULL,
	`scraped_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`source_url` text NOT NULL
);

CREATE TABLE scraped_news (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  category TEXT NOT NULL,
  query TEXT,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  image_url TEXT,
  published_at TEXT,
  scraped_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  raw_json TEXT NOT NULL
, content TEXT, topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL);

CREATE TABLE site_ads (
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

CREATE TABLE "topics" (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`article_count` integer DEFAULT 0 NOT NULL,
	`category_id` text,
	`parent_id` text,
	`type` text DEFAULT 'event' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`start_date` text,
	`end_date` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
