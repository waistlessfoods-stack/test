ALTER TABLE "service_reviews"
ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "service_reviews"
ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'customer-submission';

ALTER TABLE "service_reviews"
ADD COLUMN IF NOT EXISTS "source_key" text;

CREATE UNIQUE INDEX IF NOT EXISTS "service_reviews_source_key_idx"
ON "service_reviews" ("source_key");
