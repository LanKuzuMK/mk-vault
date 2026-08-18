CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  note TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  featured_rank INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS projects_public_order ON projects (is_published, featured_rank, created_at DESC);
