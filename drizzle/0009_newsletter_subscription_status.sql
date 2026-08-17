ALTER TABLE "subscribers"
ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true;

ALTER TABLE "subscribers"
ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();

ALTER TABLE "subscribers"
ADD COLUMN IF NOT EXISTS "unsubscribed_at" timestamp;
