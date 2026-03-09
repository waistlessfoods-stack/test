import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

async function verifyShopPage() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🔍 Verifying shop page in Contentful...\n");

  // Check content type
  try {
    const contentType = await environment.getContentType("shopPage");
    console.log("✅ Content type 'shopPage' exists");
    console.log("   - Fields:", contentType.fields.map(f => f.id).join(", "));
  } catch (error) {
    console.error("❌ Content type 'shopPage' not found");
    return;
  }

  // Check entries
  try {
    const entries = await environment.getEntries({
      content_type: "shopPage",
      limit: 1,
    });

    if (entries.items.length === 0) {
      console.error("❌ No shop page entry found");
      return;
    }

    const entry = entries.items[0];
    console.log("✅ Shop page entry found");
    console.log("   - ID:", entry.sys.id);
    console.log("   - Published:", entry.sys.publishedVersion ? "Yes" : "No");
    console.log("   - Banner Title:", entry.fields.bannerTitle?.[DEFAULT_LOCALE] || "Not set");
    console.log("   - Categories:", entry.fields.categories?.[DEFAULT_LOCALE]?.length || 0);
    console.log("   - Recipes:", entry.fields.recipes?.[DEFAULT_LOCALE]?.length || 0);
    
    if (!entry.sys.publishedVersion) {
      console.log("\n⚠️  Entry is not published. Publishing now...");
      await entry.publish();
      console.log("✅ Published shop page entry");
    }
  } catch (error) {
    console.error("❌ Error fetching shop page entry:", error.message);
  }

  console.log("\n✅ Verification complete!");
}

verifyShopPage().catch(console.error);
