import "dotenv/config";
import https from "node:https";
import { neon, neonConfig } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

neonConfig.fetchFunction = (url, options = {}) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = Object.fromEntries(new Headers(options.headers).entries());
    const request = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers,
        family: 4,
        timeout: 10_000,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString();
          const status = response.statusCode || 200;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            headers: new Headers(response.headers),
            text: async () => body,
            json: async () => JSON.parse(body),
          });
        });
      }
    );
    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy(new Error("Neon DB connection timeout"));
    });
    if (options.body) request.write(options.body);
    request.end();
  });

const sql = neon(databaseUrl);

await sql`ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`;
await sql`ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now()`;
await sql`ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "unsubscribed_at" timestamp`;

console.log("Newsletter subscriber status migration complete.");
