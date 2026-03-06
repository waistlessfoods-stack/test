import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

async function debugHomepage() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  // Fetch the homepage entry
  const entries = await environment.getEntries({
    content_type: "homepage",
    limit: 1,
    include: 2,
  });

  const entry = entries.items[0];
  
  console.log("\n=== HOMEPAGE ENTRY ===");
  console.log("Entry ID:", entry.sys.id);
  console.log("\n=== FIELDS ===");
  console.log("Features:", JSON.stringify(entry.fields.features, null, 2));
  console.log("Featured Recipes:", JSON.stringify(entry.fields.featuredRecipes, null, 2));
  console.log("Testimonials:", JSON.stringify(entry.fields.testimonials, null, 2));
  
  console.log("\n=== INCLUDES ===");
  console.log("Has includes.Entry?", !!entries.includes?.Entry);
  if (entries.includes?.Entry) {
    console.log("Number of included entries:", entries.includes.Entry.length);
    entries.includes.Entry.forEach(e => {
      console.log(`  - ${e.sys.contentType.sys.id}: ${e.sys.id}`);
    });
  }
}

debugHomepage().catch(console.error);
