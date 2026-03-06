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

console.log("🔄 Updating homepage entry...");

// Fetch the homepage entry
const entries = await environment.getEntries({ 
  content_type: "homepage",
  limit: 1 
});

if (entries.items.length === 0) {
  console.log("❌ No homepage entry found!");
  process.exit(1);
}

const entry = entries.items[0];

// Update the hero title with line break
entry.fields.heroTitle = { 
  [DEFAULT_LOCALE]: "Waste Less.\nTaste More." 
};

// Update the entry
const updatedEntry = await entry.update();
await updatedEntry.publish();

console.log("✅ Homepage entry updated successfully!");
console.log("   Hero title now includes line break");
