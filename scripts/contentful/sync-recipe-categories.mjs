#!/usr/bin/env node

import dotenv from "dotenv";
import pkg from "contentful-management";

const { createClient } = pkg;
const LOCALE = "en-US";

dotenv.config({ quiet: true });

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

if (!accessToken || !spaceId) {
  console.error("Missing Contentful credentials (CMA_CONTENTFUL + Contentful_space_id).");
  process.exit(1);
}

const REQUIRED_CATEGORY_NAMES = [
  "CHEF SPOTLIGHT",
  "PASTA",
  "VEGAN",
  "DESSERT",
];

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function getName(entry) {
  return String(entry.fields?.name?.[LOCALE] || "").trim();
}

function getSortOrder(entry) {
  const raw = entry.fields?.sortOrder?.[LOCALE];
  return typeof raw === "number" ? raw : Number.MAX_SAFE_INTEGER;
}

async function getAllEntries(environment, query) {
  const items = [];
  const limit = 100;
  let skip = 0;

  while (true) {
    const page = await environment.getEntries({ ...query, limit, skip });
    items.push(...page.items);
    skip += page.items.length;
    if (skip >= page.total || page.items.length === 0) {
      break;
    }
  }

  return items;
}

async function updateAndPublish(entry) {
  const updated = await entry.update();
  return updated.publish();
}

async function main() {
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  let categories = await getAllEntries(environment, { content_type: "recipeCategory" });
  const byName = () => {
    const map = new Map();
    for (const entry of categories) {
      map.set(normalizeName(getName(entry)), entry);
    }
    return map;
  };

  let nameMap = byName();
  const chefSpotlight = nameMap.get("chef spotlight");
  const breakfast = nameMap.get("breakfast");

  if (!chefSpotlight && breakfast) {
    const beforeName = getName(breakfast);
    breakfast.fields.name = {
      ...(breakfast.fields.name || {}),
      [LOCALE]: "CHEF SPOTLIGHT",
    };
    const published = await updateAndPublish(breakfast);
    console.log(`RENAMED  | ${published.sys.id} | ${beforeName} -> ${getName(published)}`);
    categories = await getAllEntries(environment, { content_type: "recipeCategory" });
    nameMap = byName();
  } else if (chefSpotlight) {
    console.log(`OK       | chef spotlight exists | ${chefSpotlight.sys.id}`);
  } else {
    console.log("WARN     | no BREAKFAST category found to rename");
  }

  for (const categoryName of REQUIRED_CATEGORY_NAMES) {
    if (nameMap.get(normalizeName(categoryName))) {
      continue;
    }

    try {
      const maxSortOrder = categories.reduce((max, entry) => {
        const value = entry.fields?.sortOrder?.[LOCALE];
        if (typeof value === "number") {
          return Math.max(max, value);
        }
        return max;
      }, 0);

      const created = await environment.createEntry("recipeCategory", {
        fields: {
          name: { [LOCALE]: categoryName },
          sortOrder: { [LOCALE]: maxSortOrder + 1 },
        },
      });
      const published = await created.publish();
      console.log(`CREATED  | ${published.sys.id} | ${categoryName}`);
      categories.push(published);
      nameMap.set(normalizeName(categoryName), published);
    } catch (error) {
      const message = error?.message || "unknown error";
      console.log(`ERROR    | create ${categoryName} | ${message}`);
    }
  }

  const recipesPageEntries = await environment.getEntries({
    content_type: "recipesPage",
    limit: 1,
  });

  const recipesPage = recipesPageEntries.items[0];
  if (!recipesPage) {
    console.log("ERROR    | recipesPage not found");
  } else {
    const existingRefs = Array.isArray(recipesPage.fields?.categories?.[LOCALE])
      ? [...recipesPage.fields.categories[LOCALE]]
      : [];
    const existingIds = new Set(
      existingRefs
        .map((ref) => ref?.sys?.id)
        .filter((id) => typeof id === "string" && id.length > 0)
    );

    const breakfastEntry = nameMap.get("breakfast");
    const chefSpotlightEntry = nameMap.get("chef spotlight");

    const refsWithoutBreakfast =
      breakfastEntry && chefSpotlightEntry
        ? existingRefs.filter((ref) => ref?.sys?.id !== breakfastEntry.sys.id)
        : existingRefs;

    const finalRefs = [...refsWithoutBreakfast];
    let linksAdded = 0;

    for (const categoryName of REQUIRED_CATEGORY_NAMES) {
      const entry = nameMap.get(normalizeName(categoryName));
      if (!entry || existingIds.has(entry.sys.id)) {
        continue;
      }

      finalRefs.push({
        sys: {
          type: "Link",
          linkType: "Entry",
          id: entry.sys.id,
        },
      });
      linksAdded += 1;
      existingIds.add(entry.sys.id);
    }

    const removedBreakfastLink = refsWithoutBreakfast.length !== existingRefs.length;
    if (linksAdded > 0 || removedBreakfastLink) {
      recipesPage.fields.categories = {
        ...(recipesPage.fields.categories || {}),
        [LOCALE]: finalRefs,
      };
      const published = await updateAndPublish(recipesPage);
      console.log(
        `UPDATED  | recipesPage ${published.sys.id} | +${linksAdded} links${
          removedBreakfastLink ? " | removed BREAKFAST link" : ""
        }`
      );
    } else {
      console.log("OK       | recipesPage already linked to required categories");
    }
  }

  categories = await getAllEntries(environment, { content_type: "recipeCategory" });
  categories.sort((a, b) => getSortOrder(a) - getSortOrder(b));

  console.log("FINAL    | categories");
  for (const category of categories) {
    console.log(`${getName(category)} | ${category.sys.id}`);
  }
}

main().catch((error) => {
  console.error(`FAILED   | ${error?.message || error}`);
  process.exit(1);
});
