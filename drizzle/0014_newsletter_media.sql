ALTER TABLE newsletter_issues ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '{"header":null,"footer":null,"images":[]}'::jsonb;
