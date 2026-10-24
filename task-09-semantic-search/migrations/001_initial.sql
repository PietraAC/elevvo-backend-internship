CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS catalog_metadata (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO catalog_metadata (singleton, version)
VALUES (TRUE, 1)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 5000),
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  embedding VECTOR(384) NOT NULL,
  embedding_model TEXT NOT NULL,
  embedding_content_hash CHAR(64) NOT NULL,
  embedded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_active_category_idx
  ON products (active, category);

CREATE INDEX IF NOT EXISTS products_embedding_hash_idx
  ON products (embedding_content_hash);

CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx
  ON products USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
