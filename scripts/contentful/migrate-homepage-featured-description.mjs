import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const DEFAULT_LOCALE = "en-US";

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL and Contentful_space_id."
  );
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

const defaultDescription =
  "Explore handpicked recipes built for flavor, balance, and everyday simplicity.";

async function ensureFeaturedDescriptionField() {
  let contentType = await environment.getContentType("homepage");
  const hasField = contentType.fields.some(
    (field) => field.id === "featuredDescription"
  );

  if (!hasField) {
    contentType.fields.push({
      id: "featuredDescription",
      name: "Featured Description",
      type: "Text",
      required: false,
    });
    contentType = await contentType.update();
    await contentType.publish();
    console.log("Added homepage.featuredDescription field.");
    return;
  }

  console.log("homepage.featuredDescription field already exists.");
}

async function migrateHomepageEntries() {
  const entries = await environment.getEntries({
    content_type: "homepage",
    limit: 50,
  });

  if (entries.items.length === 0) {
    console.log("No homepage entries found.");
    return;
  }

  for (const entry of entries.items) {
    const currentDescription = entry.fields.featuredDescription?.[DEFAULT_LOCALE];

    if (typeof currentDescription === "string" && currentDescription.trim()) {
      console.log(`Entry ${entry.sys.id} already has featuredDescription.`);
      continue;
    }

    entry.fields.featuredDescription = {
      [DEFAULT_LOCALE]: defaultDescription,
    };

    let updated = await entry.update();
    if (updated.isPublished()) {
      updated = await updated.publish();
    }

    console.log(`Updated homepage entry ${updated.sys.id} with featuredDescription.`);
  }
}

await ensureFeaturedDescriptionField();
await migrateHomepageEntries();

console.log("Homepage featuredDescription migration complete.");
