CREATE TABLE IF NOT EXISTS "newsletter_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"cta_label" text DEFAULT '' NOT NULL,
	"cta_url" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp,
	"last_test_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_issues_status_check" CHECK ("newsletter_issues"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_issues_archive_idx" ON "newsletter_issues" USING btree ("status","published_at");
