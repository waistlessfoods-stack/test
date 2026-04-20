#!/usr/bin/env node

import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;
dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";
const LOCALE = "en-US";

// ── Add cookTime and servingSize for each recipe by title ──
// Update these values to match your actual recipes
const RECIPE_DATA = {
  "Apple Peanut Donut Bites": { cookTime: "15 mins", servingSize: "2 servings" },
  "Almond Fudge Brownie":     { cookTime: "35 mins", servingSize: "9 servings" },
  "Creamy Tuna Roll":          { cookTime: "10 mins", servingSize: "2 servings" },
  "Mango Mint Chia Parfait":   { cookTime: "5 mins",  servingSize: "2 servings" },
  "Herby Pasta Primavera":     { cookTime: "25 mins", servingSize: "4 servings" },
  "Sweet Potato & Chickpea":   { cookTime: "40 mins", servingSize: "3 servings" },
};

const NEW_FIELDS = [
  {
    id: "cookTime",
    name: "Cook Time",
    type: "Symbol",
    required: false,
  },
  {
    id: "servingSize",
    name: "Serving Size",
    type: "Symbol",
    required: false,
  },
];

function ensureLocalized(fields, key, value) {
  return {
    ...fields,
    [key]: {
      ...(fields[key] || {}),
      [LOCALE]: value,
    },
  };
}

async function run() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing CMA_CONTENTFUL or Contentful_space_id in .env");
    process.exit(1);
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log(`✅ Connected to space: ${SPACE_ID}, environment: ${ENVIRONMENT_ID}`);

  // ── Step 1: Add fields to the Recipe content type ──
  let recipeContentType = await environment.getContentType("recipe");
  const existingFieldIds = new Set(recipeContentType.fields.map((f) => f.id));

  let addedCount = 0;
  for (const field of NEW_FIELDS) {
    if (!existingFieldIds.has(field.id)) {
      recipeContentType.fields.push(field);
      addedCount++;
      console.log(`  + Queued field: ${field.id}`);
    } else {
      console.log(`  · Field already exists: ${field.id}`);
    }
  }

  if (addedCount > 0) {
    recipeContentType = await recipeContentType.update();
    await recipeContentType.publish();
    console.log(`✅ Added and published ${addedCount} new field(s) to Recipe content type.`);
  } else {
    console.log("✅ Recipe content type already has both fields.");
  }

  // ── Step 2: Populate entries ──
  const entries = await environment.getEntries({ content_type: "recipe", limit: 200 });
  console.log(`\nFound ${entries.items.length} recipe entries. Updating...`);

  let updated = 0;
  let skipped = 0;

  for (const entry of entries.items) {
    const title = entry.fields?.title?.[LOCALE];
    const data = RECIPE_DATA[title];

    if (!data) {
      console.log(`  · Skipped (no data defined): "${title}"`);
      skipped++;
      continue;
    }

    let fields = entry.fields;
    fields = ensureLocalized(fields, "cookTime", data.cookTime);
    fields = ensureLocalized(fields, "servingSize", data.servingSize);
    entry.fields = fields;

    const updatedEntry = await entry.update();
    await updatedEntry.publish();
    console.log(`  ✅ Updated: "${title}" — ${data.cookTime} · ${data.servingSize}`);
    updated++;
  }

  console.log("\n─────────────────────────────");
  console.log(`✅ Updated : ${updated}`);
  console.log(`· Skipped : ${skipped}`);
  console.log("Done.");
}

run().catch((err) => {
  console.error("❌ Script failed:", err.message || err);
  process.exit(1);
});
