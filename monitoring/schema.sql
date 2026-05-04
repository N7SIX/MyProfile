CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  event TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  country TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_events_site_created
  ON usage_events (site, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_site_country
  ON usage_events (site, country);

CREATE INDEX IF NOT EXISTS idx_usage_events_site_ip
  ON usage_events (site, ip_address);
