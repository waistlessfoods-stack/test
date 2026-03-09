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

async function setupShopPage() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🚀 Setting up Shop page in Contentful...\n");

  // Step 1: Upload assets if needed (reusing recipe assets)
  console.log("📤 Using existing recipe assets...");
  const projectRoot = resolve(__dirname, "../..");

  async function getOrUploadAsset(title, filePath) {
    const existingAssets = await environment.getAssets({
      "fields.title": title,
    });

    if (existingAssets.items.length > 0) {
      console.log(`✓ Asset already exists: ${title}`);
      return existingAssets.items[0].sys.id;
    }

    try {
      const fullPath = resolve(projectRoot, filePath);
      const upload = await environment.createUpload({
        file: createReadStream(fullPath),
      });

      let asset = await environment.createAsset({
        fields: {
          title: { [DEFAULT_LOCALE]: title },
          file: {
            [DEFAULT_LOCALE]: {
              contentType: "image/png",
              fileName: filePath.split("/").pop(),
              uploadFrom: {
                sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
              },
            },
          },
        },
      });

      asset = await asset.processForAllLocales();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await asset.publish();

      console.log(`✅ Uploaded: ${title}`);
      return asset.sys.id;
    } catch (error) {
      console.error(`Error uploading ${title}:`, error.message);
      throw error;
    }
  }

  const assetIds = {
    banner: await getOrUploadAsset("Shop Banner", "public/recipes/banner-recipes.png"),
    beef: await getOrUploadAsset("Beef Recipes", "public/recipes/beef.png"),
    fishSeafood: await getOrUploadAsset("Fish & Seafood", "public/recipes/fish-seafood.png"),
    pasta: await getOrUploadAsset("Pasta Recipes", "public/recipes/pasta.png"),
  };

  // Step 2: Create content type
  console.log("\n🔧 Creating shop page content type...");

  let shopPageType;
  try {
    shopPageType = await environment.getContentType("shopPage");
    console.log("✓ shopPage content type already exists");
  } catch (error) {
    shopPageType = await environment.createContentTypeWithId("shopPage", {
      name: "Shop Page",
      description: "Premium recipe shop page configuration",
      displayField: "bannerTitle",
      fields: [
        {
          id: "bannerTitle",
          name: "Banner Title",
          type: "Text",
          required: true,
        },
        {
          id: "bannerDescription",
          name: "Banner Description",
          type: "Text",
          required: true,
        },
        {
          id: "bannerImage",
          name: "Banner Image",
          type: "Link",
          linkType: "Asset",
          required: true,
        },
        {
          id: "bannerFeaturedImage1",
          name: "Banner Featured Image 1",
          type: "Link",
          linkType: "Asset",
          required: false,
        },
        {
          id: "bannerFeaturedImage2",
          name: "Banner Featured Image 2",
          type: "Link",
          linkType: "Asset",
          required: false,
        },
        {
          id: "categories",
          name: "Categories",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [{ linkContentType: ["recipeCategory"] }],
          },
          required: false,
        },
        {
          id: "recipes",
          name: "Recipes",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [{ linkContentType: ["recipe"] }],
          },
          required: false,
        },
      ],
    });

    await shopPageType.publish();
    console.log("✅ Created shopPage content type");
  }

  // Step 3: Get existing recipe categories and recipes (these should exist from recipes page)
  console.log("\n📋 Fetching existing categories and recipes...");

  let categories = [];
  try {
    const categoryEntries = await environment.getEntries({
      content_type: "recipeCategory",
    });
    categories = categoryEntries.items;
    console.log(`✓ Found ${categories.length} existing categories`);
  } catch (error) {
    console.log("⚠️ No existing categories found. Please run seed-recipes-page.mjs first.");
  }

  let recipes = [];
  try {
    const recipeEntries = await environment.getEntries({
      content_type: "recipe",
    });
    // Filter only paid recipes
    recipes = recipeEntries.items.filter((recipe) => {
      const price = recipe.fields.price?.[DEFAULT_LOCALE];
      return price && price !== "Free";
    });
    console.log(`✓ Found ${recipes.length} paid recipes`);
  } catch (error) {
    console.log("⚠️ No existing recipes found. Please run seed-recipes-page.mjs first.");
  }

  // Step 4: Create shop page entry
  console.log("\n📝 Creating shop page entry...");

  const existingShopPage = await environment.getEntries({
    content_type: "shopPage",
    limit: 1,
  });

  if (existingShopPage.items.length > 0) {
    console.log("✓ Shop page entry already exists");
    const existing = existingShopPage.items[0];
    
    // Update it
    existing.fields.bannerTitle = { [DEFAULT_LOCALE]: "Premium Recipe Shop" };
    existing.fields.bannerDescription = { 
      [DEFAULT_LOCALE]: "Discover our exclusive collection of premium recipes. Add them to your cart and unlock professional cooking secrets." 
    };
    existing.fields.bannerImage = {
      [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.banner } },
    };
    existing.fields.bannerFeaturedImage1 = {
      [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.beef } },
    };
    existing.fields.bannerFeaturedImage2 = {
      [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.pasta } },
    };

    if (categories.length > 0) {
      existing.fields.categories = {
        [DEFAULT_LOCALE]: categories.map((cat) => ({
          sys: { type: "Link", linkType: "Entry", id: cat.sys.id },
        })),
      };
    }

    if (recipes.length > 0) {
      existing.fields.recipes = {
        [DEFAULT_LOCALE]: recipes.map((recipe) => ({
          sys: { type: "Link", linkType: "Entry", id: recipe.sys.id },
        })),
      };
    }

    const updated = await existing.update();
    await updated.publish();
    console.log("✅ Updated shop page entry");
  } else {
    const shopPageEntry = await environment.createEntry("shopPage", {
      fields: {
        bannerTitle: { [DEFAULT_LOCALE]: "Premium Recipe Shop" },
        bannerDescription: { 
          [DEFAULT_LOCALE]: "Discover our exclusive collection of premium recipes. Add them to your cart and unlock professional cooking secrets." 
        },
        bannerImage: {
          [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.banner } },
        },
        bannerFeaturedImage1: {
          [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.beef } },
        },
        bannerFeaturedImage2: {
          [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.pasta } },
        },
        categories: categories.length > 0 ? {
          [DEFAULT_LOCALE]: categories.map((cat) => ({
            sys: { type: "Link", linkType: "Entry", id: cat.sys.id },
          })),
        } : undefined,
        recipes: recipes.length > 0 ? {
          [DEFAULT_LOCALE]: recipes.map((recipe) => ({
            sys: { type: "Link", linkType: "Entry", id: recipe.sys.id },
          })),
        } : undefined,
      },
    });

    await shopPageEntry.publish();
    console.log("✅ Created shop page entry");
  }

  console.log("\n✨ Shop page setup complete!\n");
  console.log("📋 Summary:");
  console.log("  - Content type: shopPage");
  console.log(`  - Categories: ${categories.length}`);
  console.log(`  - Premium recipes: ${recipes.length}`);
  console.log("\n✅ The shop page is now ready to use!");
}

setupShopPage().catch(console.error);
