import dotenv from "dotenv";
import pkg from "contentful-management";

const { createClient } = pkg;
const LOCALE = "en-US";

dotenv.config({ quiet: true });

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

if (!accessToken || !spaceId) {
  console.error("Missing required Contentful env vars (CMA_CONTENTFUL and space id).");
  process.exit(1);
}

const targets = [
  { title: "CHEF SPOTLIGHT", slug: "chef-spotlight" },
  { title: "PASTA", slug: "pasta" },
  { title: "VEGAN", slug: "vegan" },
  { title: "DESSERT", slug: "dessert" },
];

async function getAllFeaturedRecipes(environment) {
  const items = [];
  const limit = 100;
  let skip = 0;

  while (true) {
    const page = await environment.getEntries({
      content_type: "featuredRecipe",
      limit,
      skip,
    });
    items.push(...page.items);
    skip += page.items.length;
    if (skip >= page.total || page.items.length === 0) break;
  }

  return items;
}

function getNumSortOrder(entry) {
  const v = entry.fields.sortOrder?.[LOCALE];
  return typeof v === "number" ? v : Number.MAX_SAFE_INTEGER;
}

async function main() {
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  const entries = await getAllFeaturedRecipes(environment);
  if (entries.length === 0) {
    console.log("No featuredRecipe entries found.");
    return;
  }

  entries.sort((a, b) => getNumSortOrder(a) - getNumSortOrder(b));

  const toProcess = entries.slice(0, 4);

  for (let i = 0; i < toProcess.length; i++) {
    const entry = toProcess[i];
    const target = targets[i];
    if (!target) continue;

    const beforeTitle = entry.fields.title?.[LOCALE] ?? "";
    const beforeSlug = entry.fields.slug?.[LOCALE] ?? "";
    const changed = beforeTitle !== target.title || beforeSlug !== target.slug;

    if (!changed) {
      console.log(`NOCHANGE | ${entry.sys.id} | ${beforeTitle} -> ${beforeTitle} | ${beforeSlug} -> ${beforeSlug}`);
      continue;
    }

    entry.fields.title = { ...(entry.fields.title || {}), [LOCALE]: target.title };
    entry.fields.slug = { ...(entry.fields.slug || {}), [LOCALE]: target.slug };

    const updated = await entry.update();
    const published = await updated.publish();

    const afterTitle = published.fields.title?.[LOCALE] ?? "";
    const afterSlug = published.fields.slug?.[LOCALE] ?? "";

    console.log(`UPDATED  | ${entry.sys.id} | ${beforeTitle} -> ${afterTitle} | ${beforeSlug} -> ${afterSlug}`);
  }

  const verifyEntries = await getAllFeaturedRecipes(environment);
  verifyEntries
    .sort((a, b) => getNumSortOrder(a) - getNumSortOrder(b))
    .forEach((entry) => {
      const sortOrder = entry.fields.sortOrder?.[LOCALE] ?? "";
      const title = entry.fields.title?.[LOCALE] ?? "";
      const slug = entry.fields.slug?.[LOCALE] ?? "";
      console.log(`${sortOrder} | ${title} | ${slug} | ${entry.sys.id}`);
    });
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
