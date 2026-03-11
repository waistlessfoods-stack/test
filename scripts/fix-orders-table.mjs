import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL,
      "stripe_session_id" text NOT NULL,
      "stripe_payment_intent_id" text,
      "status" text DEFAULT 'pending' NOT NULL,
      "amount" integer NOT NULL,
      "currency" text DEFAULT 'usd' NOT NULL,
      "items" jsonb NOT NULL,
      "customer_email" text,
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "orders_stripe_session_id_unique" UNIQUE("stripe_session_id")
    );
  `);

  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");
  `);

  const tableCheck = await sql.unsafe(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'orders'"
  );

  const rowCount = await sql.unsafe("select count(*)::int as count from orders");

  console.log("orders table status:", tableCheck[0]?.table_name ?? "missing");
  console.log("orders rows:", rowCount[0]?.count ?? 0);
}

main()
  .catch((error) => {
    console.error("Failed to prepare orders table:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
