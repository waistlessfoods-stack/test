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

async function setupRecipesPage() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("❌ Missing required environment variables");
    return;
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log("🚀 Setting up Recipes page in Contentful...\n");

  // Step 1: Upload assets
  console.log("📤 Uploading recipe assets...");
  const projectRoot = resolve(__dirname, "../..");

  async function uploadAsset(title, filePath) {
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
    banner: await uploadAsset("Recipes Banner", "public/recipes/banner-recipes.png"),
    beef: await uploadAsset("Beef Recipes", "public/recipes/beef.png"),
    fishSeafood: await uploadAsset("Fish & Seafood", "public/recipes/fish-seafood.png"),
    pasta: await uploadAsset("Pasta Recipes", "public/recipes/pasta.png"),
    meals: await uploadAsset("Healthy Meals", "public/recipes/meals.png"),
    dessert: await uploadAsset("Dessert", "public/recipes/donuts.png"),
    vegan: await uploadAsset("Vegan Recipes", "public/recipes/potato.png"),
    breakfast: await uploadAsset("Breakfast", "public/recipes/mango.png"),
    recipeDonuts: await uploadAsset("Apple Peanut Donut", "public/recipes/donuts.png"),
    recipeCake: await uploadAsset("Almond Fudge Brownie", "public/recipes/cake.png"),
    recipeCreamy: await uploadAsset("Creamy Tuna Roll", "public/recipes/creamy.png"),
    recipeMango: await uploadAsset("Mango Mint Chia", "public/recipes/mango.png"),
    recipeHerby: await uploadAsset("Herby Pasta", "public/recipes/herby-pasta.png"),
    recipePotato: await uploadAsset("Sweet Potato Chickpea", "public/recipes/potato.png"),
  };

  // Step 2: Create content types
  console.log("\n🔧 Creating content types...");

  // Recipe Category Content Type
  let recipeCategoryType;
  try {
    recipeCategoryType = await environment.getContentType("recipeCategory");
    console.log("✓ recipeCategory content type already exists");
  } catch (error) {
    recipeCategoryType = await environment.createContentTypeWithId("recipeCategory", {
      name: "Recipe Category",
      displayField: "name",
      fields: [
        { id: "name", name: "Name", type: "Symbol", required: true },
        { id: "image", name: "Image", type: "Link", linkType: "Asset", required: true },
        { id: "sortOrder", name: "Sort Order", type: "Integer", required: true },
      ],
    });
    await recipeCategoryType.publish();
    console.log("✅ Created recipeCategory content type");
  }

  // Recipe Item Content Type
  let recipeType;
  try {
    recipeType = await environment.getContentType("recipe");
    console.log("✓ recipe content type already exists");
  } catch (error) {
    recipeType = await environment.createContentTypeWithId("recipe", {
      name: "Recipe",
      displayField: "title",
      fields: [
        { id: "title", name: "Title", type: "Symbol", required: true },
        { id: "price", name: "Price", type: "Symbol", required: true },
        { id: "description", name: "Description", type: "Text", required: true },
        { id: "image", name: "Image", type: "Link", linkType: "Asset", required: true },
        { id: "sortOrder", name: "Sort Order", type: "Integer", required: true },
      ],
    });
    await recipeType.publish();
    console.log("✅ Created recipe content type");
  }

  // Recipes Page Content Type
  let recipesPageType;
  try {
    recipesPageType = await environment.getContentType("recipesPage");
    console.log("✓ recipesPage content type already exists");
  } catch (error) {
    recipesPageType = await environment.createContentTypeWithId("recipesPage", {
      name: "Recipes Page",
      displayField: "bannerTitle",
      fields: [
        { id: "bannerImage", name: "Banner Image", type: "Link", linkType: "Asset", required: true },
        { id: "bannerTitle", name: "Banner Title", type: "Text", required: true },
        { id: "bannerDescription", name: "Banner Description", type: "Text", required: true },
        { id: "bannerFeaturedImage1", name: "Banner Featured Image 1", type: "Link", linkType: "Asset", required: false },
        { id: "bannerFeaturedImage2", name: "Banner Featured Image 2", type: "Link", linkType: "Asset", required: false },
        {
          id: "categories",
          name: "Recipe Categories",
          type: "Array",
          items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["recipeCategory"] }] },
          required: true,
        },
        {
          id: "recipes",
          name: "Recipes",
          type: "Array",
          items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["recipe"] }] },
          required: true,
        },
      ],
    });
    await recipesPageType.publish();
    console.log("✅ Created recipesPage content type");
  }

  // Step 3: Create categories
  console.log("\n📝 Creating recipe categories...");
  
  const categoryData = [
    { name: "BEEF", assetId: assetIds.beef, order: 1 },
    { name: "FISH & SEAFOOD", assetId: assetIds.fishSeafood, order: 2 },
    { name: "PASTA", assetId: assetIds.pasta, order: 3 },
    { name: "HEALTHY MEALS", assetId: assetIds.meals, order: 4 },
    { name: "DESSERT", assetId: assetIds.dessert, order: 5 },
    { name: "VEGAN", assetId: assetIds.vegan, order: 6 },
    { name: "BREAKFAST", assetId: assetIds.breakfast, order: 7 },
  ];

  const categoryRefs = [];
  for (const cat of categoryData) {
    const existing = await environment.getEntries({
      content_type: "recipeCategory",
      "fields.name": cat.name,
    });

    let entry;
    if (existing.items.length > 0) {
      entry = existing.items[0];
      console.log(`✓ Category already exists: ${cat.name}`);
    } else {
      entry = await environment.createEntry("recipeCategory", {
        fields: {
          name: { [DEFAULT_LOCALE]: cat.name },
          image: { [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: cat.assetId } } },
          sortOrder: { [DEFAULT_LOCALE]: cat.order },
        },
      });
      await entry.publish();
      console.log(`✅ Created category: ${cat.name}`);
    }
    categoryRefs.push({ sys: { type: "Link", linkType: "Entry", id: entry.sys.id } });
  }

  // Step 4: Create recipes
  console.log("\n🍽️  Creating recipes...");

  const recipeData = [
    { title: "Apple Peanut Donut Bites", price: "$12", desc: "Crisp apple rings layered with peanut butter, topped with almonds and choco chips", assetId: assetIds.recipeDonuts, order: 1 },
    { title: "Almond Fudge Brownie", price: "Free", desc: "Rich, fudgy chocolate brownie topped with crunchy almond slices indulgent,", assetId: assetIds.recipeCake, order: 2 },
    { title: "Creamy Tuna Roll", price: "$12", desc: "Soft roll filled with creamy tuna salad and fresh veggies, served with crispy chips.", assetId: assetIds.recipeCreamy, order: 3 },
    { title: "Mango Mint Chia Parfait", price: "$12", desc: "Tropical layers of chia pudding, mango puree, and fresh mint - perfect morning boost.", assetId: assetIds.recipeMango, order: 4 },
    { title: "Herby Pasta Primavera", price: "$12", desc: "Colorful, cozy, and bursting with fresh veggies and herbs - your go-to dinner.", assetId: assetIds.recipeHerby, order: 5 },
    { title: "Sweet Potato & Chickpea", price: "$12", desc: "Power-packed with protein and fiber. A hearty vegan bowl with roasted sweet potatoes.", assetId: assetIds.recipePotato, order: 6 },
  ];

  const recipeRefs = [];
  for (const recipe of recipeData) {
    const existing = await environment.getEntries({
      content_type: "recipe",
      "fields.title": recipe.title,
    });

    let entry;
    if (existing.items.length > 0) {
      entry = existing.items[0];
      console.log(`✓ Recipe already exists: ${recipe.title}`);
    } else {
      entry = await environment.createEntry("recipe", {
        fields: {
          title: { [DEFAULT_LOCALE]: recipe.title },
          price: { [DEFAULT_LOCALE]: recipe.price },
          description: { [DEFAULT_LOCALE]: recipe.desc },
          image: { [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: recipe.assetId } } },
          sortOrder: { [DEFAULT_LOCALE]: recipe.order },
        },
      });
      await entry.publish();
      console.log(`✅ Created recipe: ${recipe.title}`);
    }
    recipeRefs.push({ sys: { type: "Link", linkType: "Entry", id: entry.sys.id } });
  }

  // Step 5: Create or update recipes page
  console.log("\n📄 Creating recipes page entry...");

  const existingPages = await environment.getEntries({ content_type: "recipesPage" });
  if (existingPages.items.length > 0) {
    console.log("✓ Recipes page already exists");
  } else {
    const entry = await environment.createEntry("recipesPage", {
      fields: {
        bannerImage: { [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.banner } } },
        bannerTitle: { [DEFAULT_LOCALE]: "Wholesome Recipes for Every Mood" },
        bannerDescription: { [DEFAULT_LOCALE]: "From quick bites to hearty meals, explore dishes made with simple ingredients, bold flavors, and mindful cooking." },
        bannerFeaturedImage1: { [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.recipeMango } } },
        bannerFeaturedImage2: { [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Asset", id: assetIds.recipeCake } } },
        categories: { [DEFAULT_LOCALE]: categoryRefs },
        recipes: { [DEFAULT_LOCALE]: recipeRefs },
      },
    });

    await entry.publish();
    console.log("✅ Created recipes page entry");
  }

  console.log("\n✅ Recipes page setup complete!");
}

setupRecipesPage().catch(console.error);
