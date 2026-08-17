CREATE TABLE IF NOT EXISTS "service_reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "service_slug" text NOT NULL,
  "service_title" text NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "rating" integer NOT NULL,
  "review_text" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "moderated_at" timestamp
);

CREATE INDEX IF NOT EXISTS "service_reviews_service_status_idx"
ON "service_reviews" ("service_slug", "status");

CREATE INDEX IF NOT EXISTS "service_reviews_status_created_idx"
ON "service_reviews" ("status", "created_at");
