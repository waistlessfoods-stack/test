import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

async function updateHomepageReferences() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    console.error("Required: CMA_CONTENTFUL, Contentful_space_id");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  // Get all feature items
  const featureItems = await environment.getEntries({
    content_type: "featureItem",
  });
  console.log(`Found ${featureItems.items.length} feature items`);

  const featureItemRefs = featureItems.items.map((item) => ({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: item.sys.id,
    },
  }));

  // Get all featured recipes
  const featuredRecipes = await environment.getEntries({
    content_type: "featuredRecipe",
  });
  console.log(`Found ${featuredRecipes.items.length} featured recipes`);

  const featuredRecipeRefs = featuredRecipes.items.map((item) => ({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: item.sys.id,
    },
  }));

  // Get all testimonials
  const testimonials = await environment.getEntries({
    content_type: "testimonial",
  });
  console.log(`Found ${testimonials.items.length} testimonials`);

  const testimonialRefs = testimonials.items.map((item) => ({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: item.sys.id,
    },
  }));

  // Get the homepage entry
  const homepageEntries = await environment.getEntries({
    content_type: "homepage",
  });

  if (homepageEntries.items.length === 0) {
    console.error("❌ No homepage entry found");
    return;
  }

  const homepage = homepageEntries.items[0];
  console.log(
    `\n🔄 Updating homepage entry (ID: ${homepage.sys.id})...`
  );

  // Update the homepage entry
  homepage.fields.features = { [DEFAULT_LOCALE]: featureItemRefs };
  homepage.fields.featuredRecipes = { [DEFAULT_LOCALE]: featuredRecipeRefs };
  homepage.fields.testimonials = { [DEFAULT_LOCALE]: testimonialRefs };

  const updatedEntry = await homepage.update();
  await updatedEntry.publish();

  console.log("✅ Homepage entry updated successfully!");
  console.log(`   - ${featureItemRefs.length} feature items linked`);
  console.log(`   - ${featuredRecipeRefs.length} featured recipes linked`);
  console.log(`   - ${testimonialRefs.length} testimonials linked`);
}

updateHomepageReferences().catch(console.error);
