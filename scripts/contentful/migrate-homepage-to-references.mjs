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

console.log("🔍 Checking existing homepage content type...");

// Check if homepage contentful type exists
let existingHomepage;
try {
  existingHomepage = await environment.getContentType("homepage");
  console.log("✅ Found existing homepage content type");
  
  // Unpublish and delete existing homepage entries
  const entries = await environment.getEntries({ content_type: "homepage" });
  for (const entry of entries.items) {
    if (entry.isPublished()) {
      await entry.unpublish();
      console.log("📤 Unpublished homepage entry");
    }
    await entry.delete();
    console.log("🗑️  Deleted homepage entry");
  }
  
  // Unpublish and delete the content type
  if (existingHomepage.isPublished()) {
    await existingHomepage.unpublish();
    console.log("📤 Unpublished homepage content type");
  }
  await existingHomepage.delete();
  console.log("🗑️  Deleted homepage content type");
} catch (error) {
  console.log("ℹ️  No existing homepage content type found");
}

console.log("\n🚀 Running seed script...\n");

// Now run the seed script
import("./seed-homepage-v2.mjs");
