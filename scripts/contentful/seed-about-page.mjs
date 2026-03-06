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

async function setupAboutPage() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🚀 Setting up About page in Contentful...\n");

  // Step 1: Upload assets
  console.log("📤 Uploading assets...");
  const projectRoot = resolve(__dirname, "../..");

  async function uploadAsset(title, filePath) {
    // Check for existing asset
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await asset.publish();
      
      console.log(`✅ Uploaded: ${title}`);
      return asset.sys.id;
    } catch (error) {
      console.error(`Error uploading ${title}:`, error.message);
      throw error;
    }
  }

  const chefBgAssetId = await uploadAsset("About Chef Background", "public/about/chef-bg.png");
  const foodImgAssetId = await uploadAsset("About Food Image", "public/about/food-img.png");
  const logoAssetId = await uploadAsset("WaistLess Logo", "public/logo.png");

  // Step 2: Create content type
  console.log("\n🔧 Creating aboutPage content type...");

  let aboutPageType;
  try {
    aboutPageType = await environment.getContentType("aboutPage");
    console.log("✓ Content type already exists");
  } catch (error) {
    aboutPageType = await environment.createContentTypeWithId("aboutPage", {
      name: "About Page",
      displayField: "heroTitle",
      fields: [
        { id: "heroTitle", name: "Hero Title", type: "Text", required: true },
        { id: "heroBackgroundImage", name: "Hero Background Image", type: "Link", linkType: "Asset", required: true },
        { id: "heroParagraph1", name: "Hero Paragraph 1", type: "Text", required: true },
        { id: "heroParagraph2", name: "Hero Paragraph 2", type: "Text", required: true },
        { id: "contentImage", name: "Content Image", type: "Link", linkType: "Asset", required: true },
        { id: "logoImage", name: "Logo Image", type: "Link", linkType: "Asset", required: true },
        { id: "contentHeading", name: "Content Heading", type: "Symbol", required: true },
        { id: "contentParagraph1", name: "Content Paragraph 1", type: "Text", required: true },
        { id: "contentParagraph2", name: "Content Paragraph 2", type: "Text", required: true },
        { id: "contentParagraph3", name: "Content Paragraph 3", type: "Text", required: true },
      ],
    });
    await aboutPageType.publish();
    console.log("✅ Created aboutPage content type");
  }

  // Step 3: Create or update about page entry
  console.log("\n📝 Creating about page entry...");

  const existingEntries = await environment.getEntries({ content_type: "aboutPage" });

  if (existingEntries.items.length > 0) {
    console.log("✓ About page entry already exists");
  } else {
    const entry = await environment.createEntry("aboutPage", {
      fields: {
        heroTitle: { [DEFAULT_LOCALE]: "Hey There!\nI'm Amber" },
        heroBackgroundImage: {
          [DEFAULT_LOCALE]: {
            sys: { type: "Link", linkType: "Asset", id: chefBgAssetId },
          },
        },
        heroParagraph1: {
          [DEFAULT_LOCALE]:
            "Chef Amber is the creative force behind WaistLess Foods, blending flavor, sustainability, and heart into every dish she makes.",
        },
        heroParagraph2: {
          [DEFAULT_LOCALE]:
            "As a Houston-based private chef, Amber transforms everyday ingredients into soulful, nourishing meals designed to make healthy eating effortless and enjoyable.",
        },
        contentImage: {
          [DEFAULT_LOCALE]: {
            sys: { type: "Link", linkType: "Asset", id: foodImgAssetId },
          },
        },
        logoImage: {
          [DEFAULT_LOCALE]: {
            sys: { type: "Link", linkType: "Asset", id: logoAssetId },
          },
        },
        contentHeading: { [DEFAULT_LOCALE]: "More about waistless" },
        contentParagraph1: {
          [DEFAULT_LOCALE]:
            "WaistLess is built on the idea that good food shouldn't come with waste—of ingredients, time, or intention.",
        },
        contentParagraph2: {
          [DEFAULT_LOCALE]:
            "Chef Amber created WaistLess as a space to share recipes, techniques, and simple habits that make cooking more sustainable and more joyful.",
        },
        contentParagraph3: {
          [DEFAULT_LOCALE]: "Here, we help you eat better, live brighter, and waste less.",
        },
      },
    });

    await entry.publish();
    console.log("✅ Created about page entry");
  }

  console.log("\n✅ About page setup complete!");
}

setupAboutPage().catch(console.error);
