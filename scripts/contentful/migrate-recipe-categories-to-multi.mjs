#!/usr/bin/env node

import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

const SHOULD_REMOVE_OLD_FIELD = process.argv.includes("--remove-old-field");

function isPublished(entry) {
  if (typeof entry?.isPublished === "function") {
    return entry.isPublished();
  }

  return Boolean(entry?.sys?.publishedVersion);
}

async function getDefaultLocale(environment) {
  const locales = await environment.getLocales();
  const defaultLocale = locales.items.find((locale) => locale.default);
  return defaultLocale?.code || "en-US";
}

async function fetchAllRecipeEntries(environment) {
  const entries = [];
  const limit = 100;
  let skip = 0;

  while (true) {
    const page = await environment.getEntries({
      content_type: "recipe",
      limit,
      skip,
    });

    entries.push(...page.items);

    if (page.items.length < limit) {
      break;
    }

    skip += page.items.length;
  }

  return entries;
}

async function ensureCategoriesField(environment) {
  let recipeContentType = await environment.getContentType("recipe");
  const hasCategoriesField = recipeContentType.fields.some(
    (field) => field.id === "categories"
  );

  if (hasCategoriesField) {
    console.log("✅ Recipe content type already has categories field");
    return;
  }

  recipeContentType.fields.push({
    id: "categories",
    name: "Categories",
    type: "Array",
    required: false,
    items: {
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["recipeCategory"],
        },
      ],
    },
  });

  recipeContentType = await recipeContentType.update();
  await recipeContentType.publish();

  console.log("✅ Added and published categories field on recipe content type");
}

function hasCategoryMigrationGap(entry, locale) {
  const singleCategory = entry.fields?.category?.[locale];
  const singleId = singleCategory?.sys?.id;

  if (!singleId) {
    return false;
  }

  const categories = Array.isArray(entry.fields?.categories?.[locale])
    ? entry.fields.categories[locale]
    : [];

  return !categories.some((item) => item?.sys?.id === singleId);
}

async function migrateRecipeCategories(environment, locale) {
  const entries = await fetchAllRecipeEntries(environment);

  let migrated = 0;
  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const singleCategory = entry.fields?.category?.[locale];
      const singleId = singleCategory?.sys?.id;

      if (!singleId) {
        skipped += 1;
        continue;
      }

      const currentCategories = Array.isArray(entry.fields?.categories?.[locale])
        ? entry.fields.categories[locale]
        : [];

      const alreadyIncluded = currentCategories.some((item) => item?.sys?.id === singleId);
      if (alreadyIncluded) {
        skipped += 1;
        continue;
      }

      if (!entry.fields.categories) {
        entry.fields.categories = {};
      }

      entry.fields.categories[locale] = [...currentCategories, singleCategory];

      const entryWasPublished = isPublished(entry);
      const updatedEntry = await entry.update();

      if (entryWasPublished) {
        await updatedEntry.publish();
        published += 1;
      }

      migrated += 1;
      const title = updatedEntry.fields?.title?.[locale] || updatedEntry.sys.id;
      console.log(`✅ Migrated: ${title}`);
    } catch (error) {
      failed += 1;
      const title = entry.fields?.title?.[locale] || entry.sys.id;
      console.error(`❌ Failed: ${title}`);
      console.error(`   ${error.message || error}`);
    }
  }

  return { total: entries.length, migrated, published, skipped, failed };
}

async function removeLegacyCategoryField(environment, locale) {
  const entries = await fetchAllRecipeEntries(environment);
  const gaps = entries.filter((entry) => hasCategoryMigrationGap(entry, locale));

  if (gaps.length > 0) {
    console.error("❌ Cannot remove legacy category field yet.");
    console.error(`   ${gaps.length} recipe entries still do not have matching categories data.`);
    process.exit(1);
  }

  let recipeContentType = await environment.getContentType("recipe");
  const legacyFieldIndex = recipeContentType.fields.findIndex(
    (field) => field.id === "category"
  );
  const hasLegacyField = legacyFieldIndex >= 0;

  if (!hasLegacyField) {
    console.log("✅ Legacy category field already removed");
    return;
  }

  const legacyField = recipeContentType.fields[legacyFieldIndex];

  if (!legacyField.omitted || !legacyField.disabled) {
    recipeContentType.fields[legacyFieldIndex] = {
      ...legacyField,
      omitted: true,
      disabled: true,
    };

    recipeContentType = await recipeContentType.update();
    await recipeContentType.publish();
    console.log("✅ Omitted legacy category field");

    recipeContentType = await environment.getContentType("recipe");
  }

  recipeContentType.fields = recipeContentType.fields.filter((field) => field.id !== "category");
  recipeContentType = await recipeContentType.update();
  await recipeContentType.publish();

  console.log("✅ Removed and published recipe content type without legacy category field");
}

async function run() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing CMA credentials");
    console.error("Set CMA_CONTENTFUL and Contentful_space_id (or CONTENTFUL_SPACE_ID)");
    process.exit(1);
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);
  const locale = await getDefaultLocale(environment);

  console.log(`Using space: ${SPACE_ID}`);
  console.log(`Using environment: ${ENVIRONMENT_ID}`);
  console.log(`Using default locale: ${locale}`);
  console.log("");

  await ensureCategoriesField(environment);

  console.log("");
  console.log("🔄 Migrating recipe categories...");
  const summary = await migrateRecipeCategories(environment, locale);

  console.log("");
  console.log("📊 Migration summary:");
  console.log(`   Total recipes: ${summary.total}`);
  console.log(`   Migrated: ${summary.migrated}`);
  console.log(`   Republished: ${summary.published}`);
  console.log(`   Skipped: ${summary.skipped}`);
  console.log(`   Failed: ${summary.failed}`);

  if (SHOULD_REMOVE_OLD_FIELD) {
    console.log("");
    console.log("🧹 Removing legacy category field...");
    await removeLegacyCategoryField(environment, locale);
  } else {
    console.log("");
    console.log("ℹ️ Legacy field was kept for safety.");
    console.log("   Run with --remove-old-field after verifying the app in production.");
  }
}

run().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
