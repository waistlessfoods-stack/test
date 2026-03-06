import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

// Asset IDs from upload
const ASSET_IDS = {
  hero: "52ZJu7HLZsIMK0nKBMoEDI",
  highlightRecipe: "7J8F7bciexOoUNGbyMCqNN",
  highlightEcoLiving: "7aR5Vpeyx2KbDPjdc9vDLr",
  highlightMeetChef: "4nUw1sDQD1ragnJzwuCeSH",
  highlightAmberChef: "6hayL2PXuwfuoQEhdAJwtB",
  featuredBreakfast: "pgRKoR0NC4Bfdo83buqYK",
  featuredLunch: "4By42e0CrmglIskDJhaMea",
  featuredDinner: "7yqvKeQMyBVzHxKtDPWnsq",
  featuredDessert: "6l0UtwDf3vVDbAkEwUL4P8",
  testimonialBg: "CaaSMSU2LI06pzgJYksn3",
};

async function addAssetFieldsAndMigrate() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🔄 Adding asset fields to content types...\n");

  // Helper to add asset field if it doesn't exist
  async function addAssetField(contentTypeId, fieldId, fieldName) {
    let contentType = await environment.getContentType(contentTypeId);
    const existingField = contentType.fields.find((f) => f.id === fieldId);

    if (!existingField) {
      console.log(`Adding ${fieldId} to ${contentTypeId}...`);
      
      contentType.fields.push({
        id: fieldId,
        name: fieldName,
        type: "Link",
        linkType: "Asset",
        required: false,
      });

      contentType = await contentType.update();
      await contentType.publish();
      console.log(`✅ Added ${fieldId} field to ${contentTypeId}`);
    } else {
      console.log(`✓ Field ${fieldId} already exists in ${contentTypeId}`);
    }
  }

  // Add asset fields to content types
  await addAssetField("featureItem", "image", "Image");
  await addAssetField("featuredRecipe", "image", "Image");
  await addAssetField("homepage", "heroImage", "Hero Image");
  await addAssetField("homepage", "aboutImage", "About Image");
  await addAssetField("homepage", "testimonialBackground", "Testimonial Background");

  console.log("\n🔄 Migrating entries to use asset fields...\n");

  // Update feature items
  const featureItems = await environment.getEntries({ content_type: "featureItem" });
  for (const item of featureItems.items) {
    const title = item.fields.title?.[DEFAULT_LOCALE] || "";
    let assetId;

    if (title.includes("RECIPES")) assetId = ASSET_IDS.highlightRecipe;
    else if (title.includes("ECO")) assetId = ASSET_IDS.highlightEcoLiving;
    else if (title.includes("CHEF")) assetId = ASSET_IDS.highlightMeetChef;

    if (assetId) {
      item.fields.image = {
        [DEFAULT_LOCALE]: {
          sys: { type: "Link", linkType: "Asset", id: assetId },
        },
      };

      const updated = await item.update();
      await updated.publish();
      console.log(`✅ Updated feature item: ${title}`);
    }
  }

  // Update featured recipes
  const recipes = await environment.getEntries({ content_type: "featuredRecipe" });
  for (const recipe of recipes.items) {
    const slug = recipe.fields.slug?.[DEFAULT_LOCALE] || "";
    let assetId;

    if (slug === "breakfast") assetId = ASSET_IDS.featuredBreakfast;
    else if (slug === "lunch") assetId = ASSET_IDS.featuredLunch;
    else if (slug === "dinner") assetId = ASSET_IDS.featuredDinner;
    else if (slug === "dessert") assetId = ASSET_IDS.featuredDessert;

    if (assetId) {
      recipe.fields.image = {
        [DEFAULT_LOCALE]: {
          sys: { type: "Link", linkType: "Asset", id: assetId },
        },
      };

      const updated = await recipe.update();
      await updated.publish();
      console.log(`✅ Updated featured recipe: ${slug}`);
    }
  }

  // Update homepage
  const homepages = await environment.getEntries({ content_type: "homepage" });
  if (homepages.items.length > 0) {
    const homepage = homepages.items[0];

    homepage.fields.heroImage = {
      [DEFAULT_LOCALE]: {
        sys: { type: "Link", linkType: "Asset", id: ASSET_IDS.hero },
      },
    };

    homepage.fields.aboutImage = {
      [DEFAULT_LOCALE]: {
        sys: { type: "Link", linkType: "Asset", id: ASSET_IDS.highlightAmberChef },
      },
    };

    homepage.fields.testimonialBackground = {
      [DEFAULT_LOCALE]: {
        sys: { type: "Link", linkType: "Asset", id: ASSET_IDS.testimonialBg },
      },
    };

    const updated = await homepage.update();
    await updated.publish();
    console.log("✅ Updated homepage with asset references");
  }

  console.log("\n✅ Migration complete! All entries now use Contentful assets.");
  console.log("\n💡 Note: Old imagePath fields are still present. You can remove them manually in Contentful if desired.");
}

addAssetFieldsAndMigrate().catch(console.error);
