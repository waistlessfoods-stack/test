import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

async function checkHeroTitle() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  const homepages = await environment.getEntries({ content_type: "homepage" });
  if (homepages.items.length > 0) {
    const homepage = homepages.items[0];
    const heroTitle = homepage.fields.heroTitle?.[DEFAULT_LOCALE];
    
    console.log("Current heroTitle value:");
    console.log(JSON.stringify(heroTitle));
    console.log("\nCharacter codes:");
    console.log([...heroTitle].map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`).join('\n'));
  }
}

checkHeroTitle().catch(console.error);
