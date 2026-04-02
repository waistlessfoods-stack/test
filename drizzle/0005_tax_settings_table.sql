CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "app_settings" ("key", "value")
VALUES ('sales_tax_rate', '0.0825')
ON CONFLICT ("key") DO NOTHING;
