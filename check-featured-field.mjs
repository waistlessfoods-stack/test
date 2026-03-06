import pkg from "contentful-management";
const { createClient } = pkg;
import "dotenv/config";

const DEFAULT_LOCALE = "en-US";

async function checkAndAddFeaturedField() {
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

  // Get the recipe content type
  console.log("Fetching recipe content type...");
  const recipeContentType = await environment.getContentType("recipe");
  
  console.log("\nCurrent recipe fields:");
  recipeContentType.fields.forEach(field => {
    console.log(`  - ${field.id} (${field.type})`);
  });

  // Check if featured field exists
  const hasFeaturedField = recipeContentType.fields.some(field => field.id === "featured");
  
  if (hasFeaturedField) {
    console.log("\n✅ Featured field already exists!");
    
    // Check all recipes to see which ones have featured set
    console.log("\nChecking recipes for featured status...");
    const recipes = await environment.getEntries({
      content_type: "recipe",
    });
    
    console.log(`\nFound ${recipes.items.length} recipes:`);
    recipes.items.forEach(recipe => {
      const title = recipe.fields.title?.[DEFAULT_LOCALE];
      const featured = recipe.fields.featured?.[DEFAULT_LOCALE];
      console.log(`  - ${title}: featured=${featured ?? 'not set'}`);
    });
    
  } else {
    console.log("\n⚠️ Featured field does NOT exist!");
    console.log("\nAdding featured field to recipe content type...");
    
    // Add the featured field
    recipeContentType.fields.push({
      id: "featured",
      name: "Featured",
      type: "Boolean",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    });
    
    // Update the content type
    const updatedContentType = await recipeContentType.update();
    console.log("✅ Featured field added successfully!");
    
    // Publish the content type
    await updatedContentType.publish();
    console.log("✅ Content type published!");
    
    console.log("\nYou can now:");
    console.log("1. Go to Contentful CMS");
    console.log("2. Edit each recipe you want to feature");
    console.log("3. Set the 'Featured' field to true");
    console.log("4. Publish the changes");
  }
}

checkAndAddFeaturedField().catch(console.error);
