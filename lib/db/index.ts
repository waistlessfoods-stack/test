import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Configure postgres-js client optimized for Neon's PgBouncer pooler
// Neon's pooler handles connection multiplexing, keep client pool very small
const client = postgres(process.env.DATABASE_URL, {
  // Connection pool settings - ultra-conservative for pooler
  max: 1, // ONLY 1 connection - pooler multiplexes
  idle_timeout: 120_000, // Keep connections alive much longer (2 minutes)
  connect_timeout: 15_000, // Give pooler more time to establish connections

  // Error handling
  onnotice: () => {}, // Suppress notice messages
  onclose: () => console.log("[DB] Connection closed"),
  
  // Max connection lifetime
  max_lifetime: 60 * 60, // 1 hour
});

export const db = drizzle(client, { schema });
