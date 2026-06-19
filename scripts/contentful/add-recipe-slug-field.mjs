#!/usr/bin/env node

import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;
dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";
const LOCALE = process.env.CONTENTFUL_LOCALE || "en-US";
const DRY_RUN = process.argv.includes("--dry-run");
const PAGE_SIZE = 100;

function slugify(input) {
  return String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveUniqueSlug(baseSlug, usedSlugs) {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;

  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  usedSlugs.add(candidate);
  return candidate;
}

async function getAllRecipeEntries(environment) {
  const items = [];
  let skip = 0;

  while (true) {
    const page = await environment.getEntries({
      content_type: "recipe",
      limit: PAGE_SIZE,
      skip,
      order: "sys.createdAt",
    });

    items.push(...page.items);
    skip += page.items.length;

    if (skip >= page.total || page.items.length === 0) {
      break;
    }
  }

  return items;
}

async function ensureRecipeSlugField(environment) {
  const contentType = await environment.getContentType("recipe");
  const hasSlugField = contentType.fields.some((field) => field.id === "slug");

  if (hasSlugField) {
    console.log("✓ Recipe content type already has a slug field");
    return false;
  }

  contentType.fields.push({
    id: "slug",
    name: "Slug",
    type: "Symbol",
    required: false,
    validations: [{ unique: true }],
  });

  if (DRY_RUN) {
    console.log("[dry-run] Would add slug field to recipe content type");
    return true;
  }

  const updatedContentType = await contentType.update();
  await updatedContentType.publish();
  console.log("✅ Added slug field to recipe content type");
  return true;
}

async function main() {
  if (!CMA_TOKEN || !SPACE_ID) {
    throw new Error(
      "Missing Contentful credentials. Set CMA_CONTENTFUL or CONTENTFUL_MANAGEMENT_TOKEN, and CONTENTFUL_SPACE_ID."
    );
  }

  console.log(
    `Starting recipe slug migration for space=${SPACE_ID} environment=${ENVIRONMENT_ID} locale=${LOCALE}${DRY_RUN ? " [dry-run]" : ""}`
  );

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  await ensureRecipeSlugField(environment);

  const entries = await getAllRecipeEntries(environment);
  const usedSlugs = new Set(
    entries
      .map((entry) => entry.fields?.slug?.[LOCALE])
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim())
  );

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    const title = entry.fields?.title?.[LOCALE];
    const currentSlug = entry.fields?.slug?.[LOCALE];

    if (currentSlug && typeof currentSlug === "string" && currentSlug.trim().length > 0) {
      console.log(`✓ ${title || entry.sys.id} already has slug: ${currentSlug}`);
      skippedCount += 1;
      continue;
    }

    const baseSlug = slugify(title);

    if (!title || !baseSlug) {
      console.warn(`⚠ Skipping ${entry.sys.id}: missing usable title for slug generation`);
      skippedCount += 1;
      continue;
    }

    usedSlugs.delete(currentSlug);
    const nextSlug = resolveUniqueSlug(baseSlug, usedSlugs);

    if (DRY_RUN) {
      console.log(`[dry-run] Would set recipe slug: ${title} -> ${nextSlug}`);
      updatedCount += 1;
      continue;
    }

    try {
      entry.fields.slug = {
        ...(entry.fields.slug || {}),
        [LOCALE]: nextSlug,
      };

      const updatedEntry = await entry.update();
      await updatedEntry.publish();
      console.log(`✅ Set recipe slug: ${title} -> ${nextSlug}`);
      updatedCount += 1;
    } catch (error) {
      errorCount += 1;
      console.error(`❌ Failed to set recipe slug for ${title || entry.sys.id}:`, error);
    }
  }

  console.log(
    `Finished recipe slug migration. Updated=${updatedCount} Skipped=${skippedCount} Errors=${errorCount}`
  );

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to add recipe slug field:", error);
  process.exit(1);
});
