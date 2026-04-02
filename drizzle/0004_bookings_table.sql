CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_slug" text NOT NULL,
	"service_title" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"guests" integer NOT NULL,
	"preferred_date" text NOT NULL,
	"alternative_date" text,
	"notes" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
