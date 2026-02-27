CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  canonical_url TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  feed_url TEXT,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  image_url TEXT,
  source_domain TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_canonical_url ON articles(canonical_url);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
CREATE INDEX IF NOT EXISTS idx_articles_source_domain ON articles(source_domain);
