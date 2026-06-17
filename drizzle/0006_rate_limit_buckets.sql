CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" text PRIMARY KEY NOT NULL,
  "count" integer NOT NULL,
  "reset_at" timestamp NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx"
ON "rate_limit_buckets" ("reset_at");
