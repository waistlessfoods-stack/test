import "dotenv/config";
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = neon(databaseUrl);
const dryRun = process.argv.includes("--dry-run");
const suppliedOn = new Date("2026-08-19T12:00:00.000Z");

const reviews = [
  {
    serviceSlug: "private",
    serviceTitle: "Private Chef",
    name: "Sheila Kwarteng",
    rating: 5,
    reviewText:
      "Chef Amber traveled out of state to cook for us, and she did not disappoint! She created a six-course dinner right in our home, and every course was better than the last. It felt like having our own private restaurant for the evening. The food, presentation, and whole experience were incredible.",
  },
  {
    serviceSlug: "private",
    serviceTitle: "Private Chef",
    name: "J.D.",
    rating: 4,
    reviewText:
      "Surprised my wife with a 3-course anniversary dinner. The courses were well prepared and the service was top-notch. We ate one of the courses blind folded. Unique and cool experience all around.",
  },
  {
    serviceSlug: "private",
    serviceTitle: "Private Chef",
    name: "Lisa Barnes",
    rating: 5,
    reviewText:
      "Hired Chef Amber for a bachelorette dinner with my closest girlfriends, and she made the night so special. The food was amazing, everything was beautifully presented, and we were able to relax and enjoy the evening together.",
  },
  {
    serviceSlug: "catering",
    serviceTitle: "Catering",
    name: "Anonymous",
    rating: null,
    reviewText:
      "Chef Amber catered a small, intimate corporate event for us and made the entire experience seamless. She handled the buffet setup, assisted with service, and kept everything running smoothly. My staff really enjoyed the food, and several even said it was some of the best catering they’ve had.",
  },
  {
    serviceSlug: "catering",
    serviceTitle: "Catering",
    name: "Dana F.",
    rating: null,
    reviewText:
      "Enjoyed the food just as much as I did working with Chef Amber. She was professional and communicated throughout the entire process. No surprises, just great food and great memories.",
  },
  {
    serviceSlug: "catering",
    serviceTitle: "Catering",
    name: "Dani Crane",
    rating: null,
    reviewText:
      "Chef Amber made my husband’s 40th birthday one to remember! The décor was beautiful, and she added special touches throughout that reflected things he loves. Every detail was thoughtfully planned, and she even surprised him with a keepsake to remember the evening. The food was delicious, and the presentation was beautiful.",
  },
  {
    serviceSlug: "cooking-classes",
    serviceTitle: "Cooking Classes",
    name: "Candace S.",
    rating: null,
    reviewText:
      "I’m an experienced home cook and was looking for a class that would take my skills to the next level. Chef Amber’s in-home cooking class was perfect. She shared practical techniques for elevating dishes, from plating to the little details that make a meal feel restaurant-quality. I walked away with skills I can use going forward.",
  },
  {
    serviceSlug: "cooking-classes",
    serviceTitle: "Cooking Classes",
    name: "Queen Davina Chambliss",
    rating: null,
    reviewText:
      "Honestly, one of the best cooking classes I’ve been to! The vibe, music, and energy from Chef Amber and her team made it such a fun experience. I even learned how to make whipped cream from scratch. Definitely going to the next class!",
  },
  {
    serviceSlug: "cooking-classes",
    serviceTitle: "Cooking Classes",
    name: "Zahir Nashid",
    rating: null,
    reviewText:
      "This was my first cooking class, and I was really impressed. I don’t cook much, so I loved that Chef Amber’s beginner class was easy to follow and didn’t feel overwhelming. I actually enjoyed cooking, and the food I made was really yummy!",
  },
];

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        action: "import-client-service-reviews",
        placeholderReviewsToReject: 9,
        reviews,
      },
      null,
      2
    )
  );
  process.exit(0);
}

await sql`ALTER TABLE "service_reviews" ALTER COLUMN "rating" DROP NOT NULL`;

const placeholderResult = await sql`
  UPDATE "service_reviews"
  SET
    "status" = 'rejected',
    "updated_at" = NOW(),
    "moderated_at" = NOW()
  WHERE
    "source" = 'contentful-import'
    AND "review_text" IN (
      'Chef Amber menyulap makan malam kami jadi luar biasa! Presentasi cantik dan rasanya premium.',
      'Professional service dari awal sampai akhir. Highly recommended untuk acara spesial.',
      'Menu sangat personal dan sesuai request kami. Pengalaman dining yang intimate.'
    )
  RETURNING "id"
`;

let inserted = 0;
let refreshed = 0;

for (const [index, review] of reviews.entries()) {
  const sourceKey = crypto
    .createHash("sha256")
    .update(
      `client-review-2026-08-19|${review.serviceSlug}|${review.name}|${review.reviewText}`
    )
    .digest("hex");
  const createdAt = new Date(suppliedOn.getTime() - index * 1000);
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
      ${review.serviceSlug},
      ${review.serviceTitle},
      ${review.name},
      ${null},
      ${review.rating},
      ${review.reviewText},
      'approved',
      'client-supplied',
      ${sourceKey},
      ${createdAt},
      ${createdAt},
      ${createdAt}
    )
    ON CONFLICT ("source_key") DO UPDATE SET
      "service_slug" = EXCLUDED."service_slug",
      "service_title" = EXCLUDED."service_title",
      "name" = EXCLUDED."name",
      "rating" = EXCLUDED."rating",
      "review_text" = EXCLUDED."review_text",
      "source" = EXCLUDED."source",
      "updated_at" = NOW()
    RETURNING (xmax = 0) AS "inserted"
  `;

  if (result[0]?.inserted) inserted += 1;
  else refreshed += 1;
}

console.log(
  `Client review import complete: ${inserted} inserted, ${refreshed} refreshed, ${placeholderResult.length} placeholder reviews rejected.`
);
