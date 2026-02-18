CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
