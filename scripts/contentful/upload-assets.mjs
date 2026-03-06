import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";
import { createReadStream } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

// Define all images that need to be uploaded
const IMAGES = [
  // Hero
  { id: "hero", path: "public/hero.png", title: "Hero Image" },
  
  // Features/Highlights
  { id: "highlight-recipe", path: "public/highlight/recipe.png", title: "Recipes for Every Mood" },
  { id: "highlight-eco-living", path: "public/highlight/eco-living.png", title: "Eco Living Tips" },
  { id: "highlight-meet-chef", path: "public/highlight/meet-chef.png", title: "Meet Chef Amber" },
  { id: "highlight-amber-chef", path: "public/highlight/amber-chef.png", title: "Chef Amber Portrait" },
  
  // Featured Recipes
  { id: "featured-breakfast", path: "public/featured/breakfast.png", title: "Breakfast Recipes" },
  { id: "featured-lunch", path: "public/featured/lunch.png", title: "Lunch Recipes" },
  { id: "featured-dinner", path: "public/featured/dinner.png", title: "Dinner Recipes" },
  { id: "featured-dessert", path: "public/featured/dessert.png", title: "Dessert Recipes" },
  
  // Testimonial Background
  { id: "testimonial-bg", path: "public/testimonial.png", title: "Testimonial Background" },
];

async function uploadAssets() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🚀 Starting asset upload process...\n");

  const uploadedAssets = {};

  for (const image of IMAGES) {
    try {
      // Check if asset already exists with this title
      const existingAssets = await environment.getAssets({
        "fields.title[match]": image.title,
      });

      let asset;
      
      if (existingAssets.items.length > 0) {
        asset = existingAssets.items[0];
        console.log(`✓ Asset already exists: ${image.title} (${asset.sys.id})`);
      } else {
        // Resolve path from project root
        const projectRoot = resolve(__dirname, "../..");
        const filePath = resolve(projectRoot, image.path);

        console.log(`📤 Uploading: ${image.title}...`);
        
        // Create upload from file
        const upload = await environment.createUpload({
          file: createReadStream(filePath),
        });

        // Create asset
        asset = await environment.createAsset({
          fields: {
            title: {
              [DEFAULT_LOCALE]: image.title,
            },
            file: {
              [DEFAULT_LOCALE]: {
                contentType: "image/png",
                fileName: image.path.split("/").pop(),
                uploadFrom: {
                  sys: {
                    type: "Link",
                    linkType: "Upload",
                    id: upload.sys.id,
                  },
                },
              },
            },
          },
        });

        // Process and publish
        asset = await asset.processForAllLocales();
        
        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Publish
        await asset.publish();
        
        console.log(`✅ Uploaded and published: ${image.title} (${asset.sys.id})`);
      }

      uploadedAssets[image.id] = asset.sys.id;
    } catch (error) {
      console.error(`❌ Failed to upload ${image.title}:`, error.message);
    }
  }

  console.log("\n✅ Asset upload complete!");
  console.log("\nAsset IDs:");
  console.log(JSON.stringify(uploadedAssets, null, 2));

  return uploadedAssets;
}

uploadAssets().catch(console.error);
