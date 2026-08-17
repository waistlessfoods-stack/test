import "dotenv/config";
import crypto from "node:crypto";
import https from "node:https";
import { neon, neonConfig } from "@neondatabase/serverless";
import { createClient } from "contentful";

const databaseUrl = process.env.DATABASE_URL;
const accessToken =
  process.env.CONTENTFUL_DELIVERY_TOKEN ||
  process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN;
const spaceId =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environment =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!databaseUrl || !accessToken || !spaceId) {
  throw new Error(
    "DATABASE_URL, CONTENTFUL_DELIVERY_TOKEN, and CONTENTFUL_SPACE_ID are required."
  );
}

// Match the application's IPv4-only Neon transport for hosts without IPv6 routing.
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
const contentful = createClient({ space: spaceId, accessToken, environment });
const allowedSlugs = new Set(["private", "catering", "cooking-classes"]);

function importedDate(relativeDate) {
  const date = new Date();
  const match = String(relativeDate || "").match(
    /^(\d+)\s+(day|week|month|year)s?\s+ago$/i
  );
  if (!match) return date;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "day") date.setUTCDate(date.getUTCDate() - amount);
  if (unit === "week") date.setUTCDate(date.getUTCDate() - amount * 7);
  if (unit === "month") date.setUTCMonth(date.getUTCMonth() - amount);
  if (unit === "year") date.setUTCFullYear(date.getUTCFullYear() - amount);
  return date;
}

await sql`ALTER TABLE "service_reviews" ALTER COLUMN "email" DROP NOT NULL`;
await sql`ALTER TABLE "service_reviews" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'customer-submission'`;
await sql`ALTER TABLE "service_reviews" ADD COLUMN IF NOT EXISTS "source_key" text`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS "service_reviews_source_key_idx" ON "service_reviews" ("source_key")`;

const entries = await contentful.getEntries({
  content_type: "service",
  limit: 100,
});

let imported = 0;
let alreadyManaged = 0;

for (const entry of entries.items) {
  const slug = String(entry.fields.slug || "");
  if (!allowedSlugs.has(slug)) continue;

  const serviceTitle = String(entry.fields.title || slug);
  const reviews = entry.fields.reviews;
  const items = Array.isArray(reviews?.items) ? reviews.items : [];

  for (const [index, review] of items.entries()) {
    const name = String(review?.name || "").trim();
    const reviewText = String(review?.comment || "").trim();
    const rating = Number(review?.rating);
    if (!name || !reviewText || !Number.isInteger(rating)) continue;

    const sourceKey = crypto
      .createHash("sha256")
      .update(`${entry.sys.id}|${slug}|${index}|${name}|${reviewText}`)
      .digest("hex");
    const createdAt = importedDate(review?.date);
    const result = await sql`
      INSERT INTO "service_reviews" (
        "service_slug",
        "service_title",
        "name",
        "email",
        "rating",
        "review_text",
        "status",
        "source",
        "source_key",
        "created_at",
        "updated_at",
        "moderated_at"
      ) VALUES (
        ${slug},
        ${serviceTitle},
        ${name},
        ${null},
        ${rating},
        ${reviewText},
        'approved',
        'contentful-import',
        ${sourceKey},
        ${createdAt},
        ${createdAt},
        ${createdAt}
      )
      ON CONFLICT ("source_key") DO NOTHING
      RETURNING "id"
    `;

    if (result.length) imported += 1;
    else alreadyManaged += 1;
  }
}

console.log(
  `Service review migration complete: ${imported} imported, ${alreadyManaged} already managed.`
);
