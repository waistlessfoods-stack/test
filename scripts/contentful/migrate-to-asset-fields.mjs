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

async function migrateToAssetFields() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🔄 Migrating content types to use Asset fields...\n");

  // Helper function to create or update content type
  async function createOrUpdateContentType(id, definition) {
    let contentType;
    try {
      contentType = await environment.getContentType(id);
      
      // Unpublish if published
      if (contentType.sys.publishedVersion) {
        contentType = await contentType.unpublish();
      }
      
      // Step 1: Mark old image path field as omitted (if it exists)
      const imagePathField = contentType.fields.find(f => f.id === "imagePath");
      if (imagePathField) {
        imagePathField.omitted = true;
      }
      
      // Step 2: Add new image field (if not exists)
      const imageField = contentType.fields.find(f => f.id === "image");
      if (!imageField) {
        contentType.fields.push({
          id: "image",
          name: "Image",
          type: "Link",
          linkType: "Asset",
          required: false, // Set to false initially
        });
      }
      
      // Update all other fields
      contentType.name = definition.name;
      contentType.displayField = definition.displayField;
      
      // Update fields from definition (except image which we already added)
      definition.fields.forEach(defField => {
        if (defField.id !== "image" && defField.id !== "imagePath") {
          const existingField = contentType.fields.find(f => f.id === defField.id);
          if (existingField) {
            Object.assign(existingField, defField);
          } else {
            contentType.fields.push(defField);
          }
        }
      });
      
      contentType = await contentType.update();
      await contentType.publish();
      console.log(`✅ Updated content type: ${id}`);
    } catch (error) {
      if (error.message.includes("not found")) {
        contentType = await environment.createContentTypeWithId(id, definition);
        await contentType.publish();
        console.log(`✅ Created content type: ${id}`);
      } else {
        throw error;
      }
    }

    return contentType;
  }

  // 1. Update Feature Item Content Type
  await createOrUpdateContentType("featureItem", {
    name: "Feature Item",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      { id: "description", name: "Description", type: "Text", required: true },
      {
        id: "image",
        name: "Image",
        type: "Link",
        linkType: "Asset",
        required: true,
      },
      { id: "buttonLabel", name: "Button Label", type: "Symbol", required: false },
      { id: "buttonHref", name: "Button Href", type: "Symbol", required: false },
      { id: "sortOrder", name: "Sort Order", type: "Integer", required: true },
    ],
  });

  // 2. Update Featured Recipe Content Type
  await createOrUpdateContentType("featuredRecipe", {
    name: "Featured Recipe",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      { id: "slug", name: "Slug", type: "Symbol", required: true },
      { id: "description", name: "Description", type: "Text", required: true },
      {
        id: "image",
        name: "Image",
        type: "Link",
        linkType: "Asset",
        required: true,
      },
      { id: "sortOrder", name: "Sort Order", type: "Integer", required: true },
    ],
  });

  // 3. Update Homepage Content Type
  await createOrUpdateContentType("homepage", {
    name: "Homepage",
    displayField: "heroTitle",
    fields: [
      { id: "heroTitle", name: "Hero Title", type: "Symbol", required: true },
      { id: "heroSubtitle", name: "Hero Subtitle", type: "Text", required: true },
      {
        id: "heroImage",
        name: "Hero Image",
        type: "Link",
        linkType: "Asset",
        required: true,
      },
      { id: "heroPrimaryCtaLabel", name: "Hero Primary CTA Label", type: "Symbol", required: true },
      { id: "heroPrimaryCtaHref", name: "Hero Primary CTA Href", type: "Symbol", required: true },
      { id: "heroSecondaryCtaLabel", name: "Hero Secondary CTA Label", type: "Symbol", required: true },
      { id: "heroSecondaryCtaHref", name: "Hero Secondary CTA Href", type: "Symbol", required: true },
      { id: "featuresHeading", name: "Features Heading", type: "Symbol", required: true },
      { id: "featuresIntro", name: "Features Intro", type: "Text", required: true },
      {
        id: "features",
        name: "Features",
        type: "Array",
        items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["featureItem"] }] },
        required: true,
      },
      { id: "aboutHeading", name: "About Heading", type: "Symbol", required: true },
      { id: "aboutBodyPrimary", name: "About Body Primary", type: "Text", required: true },
      { id: "aboutBodySecondary", name: "About Body Secondary", type: "Text", required: true },
      { id: "aboutBodyTertiary", name: "About Body Tertiary", type: "Text", required: true },
      { id: "aboutBullets", name: "About Bullets", type: "Array", items: { type: "Symbol" }, required: true },
      { id: "aboutButtonLabel", name: "About Button Label", type: "Symbol", required: true },
      { id: "aboutButtonHref", name: "About Button Href", type: "Symbol", required: false },
      {
        id: "aboutImage",
        name: "About Image",
        type: "Link",
        linkType: "Asset",
        required: true,
      },
      { id: "featuredHeading", name: "Featured Heading", type: "Symbol", required: true },
      {
        id: "featuredRecipes",
        name: "Featured Recipes",
        type: "Array",
        items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["featuredRecipe"] }] },
        required: true,
      },
      {
        id: "testimonialBackground",
        name: "Testimonial Background",
        type: "Link",
        linkType: "Asset",
        required: true,
      },
      {
        id: "testimonials",
        name: "Testimonials",
        type: "Array",
        items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["testimonial"] }] },
        required: true,
      },
    ],
  });

  console.log("\n✅ Content types migrated to use Asset fields!");
  console.log("\nNow updating entries with asset references...\n");

  // Update feature items
  const featureItems = await environment.getEntries({ content_type: "featureItem" });
  for (const item of featureItems.items) {
    const title = item.fields.title[DEFAULT_LOCALE];
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
    const slug = recipe.fields.slug[DEFAULT_LOCALE];
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
}

migrateToAssetFields().catch(console.error);
