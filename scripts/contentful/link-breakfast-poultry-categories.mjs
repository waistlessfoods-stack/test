#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pkg from "contentful-management";

const { createClient } = pkg;
const LOCALE = "en-US";
const REQUIRED_CATEGORY_NAMES = ["BREAKFAST", "POULTRY"];

dotenv.config({ quiet: true });

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful credentials (CMA_CONTENTFUL + Contentful_space_id)."
  );
}

function normalizeName(value) {
  return String(value || "").trim().toUpperCase();
}

function entryLink(id) {
  return {
    sys: {
      type: "Link",
      linkType: "Entry",
      id,
    },
  };
}

async function updateAndPublish(entry) {
  const updated = await entry.update();
  return updated.publish();
}

async function createPoultryImage(environment) {
  const sourcePath = path.resolve("public", "recipes", "meals.png");
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Poultry category image not found: ${sourcePath}`);
  }

  const asset = await environment.createAssetFromFiles({
    fields: {
      title: { [LOCALE]: "POULTRY" },
      file: {
        [LOCALE]: {
          contentType: "image/png",
          fileName: "poultry-category.png",
          file: fs.createReadStream(sourcePath),
        },
      },
    },
  });
  const processedAsset = await asset.processForAllLocales();
  return processedAsset.publish();
}

async function main() {
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  const categoryResult = await environment.getEntries({
    content_type: "recipeCategory",
    limit: 100,
  });
  const categories = [...categoryResult.items];
  const byName = new Map(
    categories.map((entry) => [
      normalizeName(entry.fields?.name?.[LOCALE]),
      entry,
    ])
  );

  if (!byName.has("POULTRY")) {
    const maxSortOrder = categories.reduce(
      (max, entry) =>
        Math.max(max, Number(entry.fields?.sortOrder?.[LOCALE] || 0)),
      0
    );
    const image = await createPoultryImage(environment);
    const poultry = await environment.createEntry("recipeCategory", {
      fields: {
        name: { [LOCALE]: "POULTRY" },
        sortOrder: { [LOCALE]: maxSortOrder + 1 },
        image: {
          [LOCALE]: {
            sys: { type: "Link", linkType: "Asset", id: image.sys.id },
          },
        },
      },
    });
    const publishedPoultry = await poultry.publish();
    categories.push(publishedPoultry);
    byName.set("POULTRY", publishedPoultry);
    console.log(`CREATED  | POULTRY | ${publishedPoultry.sys.id}`);
  } else {
    console.log(`OK       | POULTRY exists | ${byName.get("POULTRY").sys.id}`);
  }

  for (const categoryName of REQUIRED_CATEGORY_NAMES) {
    if (!byName.has(categoryName)) {
      throw new Error(`${categoryName} category is missing in Contentful.`);
    }
  }

  for (const contentType of ["recipesPage", "shopPage"]) {
    const pageResult = await environment.getEntries({
      content_type: contentType,
      limit: 1,
    });
    const page = pageResult.items[0];
    if (!page) {
      throw new Error(`${contentType} entry not found.`);
    }

    const existingRefs = Array.isArray(page.fields?.categories?.[LOCALE])
      ? [...page.fields.categories[LOCALE]]
      : [];
    const existingIds = new Set(existingRefs.map((ref) => ref?.sys?.id));
    const addedNames = [];

    for (const categoryName of REQUIRED_CATEGORY_NAMES) {
      const category = byName.get(categoryName);
      if (!existingIds.has(category.sys.id)) {
        existingRefs.push(entryLink(category.sys.id));
        existingIds.add(category.sys.id);
        addedNames.push(categoryName);
      }
    }

    if (addedNames.length === 0) {
      console.log(`OK       | ${contentType} already links both categories`);
      continue;
    }

    page.fields.categories = {
      ...(page.fields.categories || {}),
      [LOCALE]: existingRefs,
    };
    const publishedPage = await updateAndPublish(page);
    console.log(
      `UPDATED  | ${contentType} ${publishedPage.sys.id} | +${addedNames.join(", ")}`
    );
  }
}

main().catch((error) => {
  console.error(`FAILED   | ${error?.message || error}`);
  process.exit(1);
});
