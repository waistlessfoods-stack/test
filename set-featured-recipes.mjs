import pkg from "contentful-management";
const { createClient } = pkg;
import "dotenv/config";

const DEFAULT_LOCALE = "en-US";

async function setFeaturedRecipes() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

  if (!accessToken || !spaceId) {
    console.error("Missing Contentful configuration. Check environment variables.");
    return;
  }

  console.log("Connecting to Contentful...");
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  // Get all recipes
  console.log("Fetching recipes...");
  const recipes = await environment.getEntries({
    content_type: "recipe",
    order: "fields.sortOrder",
  });

  console.log(`\nFound ${recipes.items.length} recipes:`);
  recipes.items.forEach((recipe, index) => {
    const title = recipe.fields.title?.[DEFAULT_LOCALE];
    const featured = recipe.fields.featured?.[DEFAULT_LOCALE];
    console.log(`  ${index + 1}. ${title} (featured: ${featured ?? 'not set'})`);
  });

  // Set first 3 recipes as featured
  console.log("\nSetting first 3 recipes as featured...");
  const recipesToFeature = recipes.items.slice(0, 3);

  for (const recipe of recipesToFeature) {
    const title = recipe.fields.title?.[DEFAULT_LOCALE];
    console.log(`\nProcessing: ${title}`);
    
    try {
      // Set featured to true
      recipe.fields.featured = {
        [DEFAULT_LOCALE]: true
      };
      
      const updated = await recipe.update();
      console.log(`  ✅ Updated`);
      
      await updated.publish();
      console.log(`  ✅ Published`);
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }

  console.log("\n✅ Done! First 3 recipes are now featured.");
  console.log("\nYou should now see these recipes displayed on the recipes page with the featured badge.");
}

setFeaturedRecipes().catch(console.error);
