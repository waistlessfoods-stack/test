#!/usr/bin/env node

import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;
dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";
const LOCALE = "en-US";

const DETAIL_BY_TITLE = {
  "Apple Peanut Donut Bites": {
    detailDescription:
      "Apple Peanut Donut Bites are a healthy, no-bake snack made with fresh apple slices shaped like a donut, slathered in creamy peanut butter, and topped with nuts and dark chocolate chips. Perfect for a light breakfast, afternoon snack, or a kid-friendly treat.",
    ingredients: [
      "1 large apple (Fuji / Gala / Honeycrisp)",
      "3-4 tbsp peanut butter (smooth or crunchy)",
      "Almonds or mixed nuts, chopped",
      "Dark chocolate chips",
      "Honey (optional)",
    ],
    tools: ["Knife", "Apple corer (optional)", "Cutting board", "Spoon"],
    instructionSteps: [
      {
        title: "Step 1 - Slice the Apple",
        description:
          "Wash the apple thoroughly. Slice it into thick rounds, then remove the core from the center to create donut-shaped rings.",
        imagePath: "/recipes/donuts.png",
      },
      {
        title: "Step 2 - Spread the Peanut Butter",
        description:
          "Using a spoon or butter knife, spread an even layer of peanut butter over each apple ring.",
        imagePath: "/recipes/donuts.png",
      },
      {
        title: "Step 3 - Add the Toppings",
        description:
          "Sprinkle chopped nuts and dark chocolate chips evenly on top of the peanut butter.",
        imagePath: "/recipes/donuts.png",
      },
    ],
  },
  "Almond Fudge Brownie": {
    detailDescription:
      "Almond Fudge Brownie is a rich, deeply chocolatey bake with a soft fudgy center and a delicate crackly top. Finished with toasted almond slices, this dessert balances sweetness with a light nutty crunch in every bite.",
    ingredients: [
      "1/2 cup unsalted butter",
      "180 g dark chocolate",
      "3/4 cup brown sugar",
      "2 eggs",
      "1/2 cup all-purpose flour",
      "1/4 cup cocoa powder",
      "1/3 cup sliced almonds",
      "Pinch of salt",
    ],
    tools: ["Mixing bowl", "Whisk", "Spatula", "8-inch baking pan", "Oven"],
    instructionSteps: [
      {
        title: "Step 1 - Prepare the Batter",
        description:
          "Melt butter and dark chocolate together, then whisk in sugar and eggs until glossy.",
        imagePath: "/recipes/cake.png",
      },
      {
        title: "Step 2 - Fold and Pour",
        description:
          "Fold in flour, cocoa, and salt. Pour into a lined pan and top with sliced almonds.",
        imagePath: "/recipes/cake.png",
      },
      {
        title: "Step 3 - Bake and Cool",
        description:
          "Bake until edges set and center is slightly soft. Cool before slicing for clean fudgy squares.",
        imagePath: "/recipes/cake.png",
      },
    ],
  },
  "Creamy Tuna Roll": {
    detailDescription:
      "Creamy Tuna Roll combines flaky tuna, crisp vegetables, and a smooth dressing wrapped in a soft roll. It is a quick lunch option with balanced texture and flavor, ideal for meal prep or an easy family meal.",
    ingredients: [
      "2 soft sandwich rolls",
      "1 can tuna in water, drained",
      "2 tbsp Greek yogurt or mayo",
      "1 tsp mustard",
      "1 tbsp diced celery",
      "1 tbsp finely diced red onion",
      "Lettuce leaves",
      "Salt and black pepper",
    ],
    tools: ["Mixing bowl", "Fork", "Knife", "Cutting board", "Spoon"],
    instructionSteps: [
      {
        title: "Step 1 - Make the Tuna Mix",
        description:
          "Combine tuna, yogurt, mustard, celery, onion, salt, and pepper until creamy and evenly mixed.",
        imagePath: "/recipes/creamy.png",
      },
      {
        title: "Step 2 - Prepare the Roll",
        description:
          "Slice rolls, add lettuce, and spoon in a generous layer of tuna filling.",
        imagePath: "/recipes/creamy.png",
      },
      {
        title: "Step 3 - Finish and Serve",
        description:
          "Close the rolls, slice if desired, and serve immediately with chips or salad.",
        imagePath: "/recipes/creamy.png",
      },
    ],
  },
  "Mango Mint Chia Parfait": {
    detailDescription:
      "Mango Mint Chia Parfait is a refreshing layered breakfast made with creamy chia pudding, vibrant mango puree, and fresh mint. It is light, naturally sweet, and easy to prepare ahead for busy mornings.",
    ingredients: [
      "3 tbsp chia seeds",
      "1 cup milk of choice",
      "1 tbsp maple syrup",
      "1 ripe mango",
      "1/2 cup yogurt",
      "Fresh mint leaves",
      "Optional granola topping",
    ],
    tools: ["Jar or glass", "Blender", "Spoon", "Mixing bowl", "Measuring cup"],
    instructionSteps: [
      {
        title: "Step 1 - Make Chia Base",
        description:
          "Mix chia seeds, milk, and maple syrup. Chill for at least 2 hours until pudding-like.",
        imagePath: "/recipes/mango.png",
      },
      {
        title: "Step 2 - Blend Mango",
        description:
          "Blend mango until smooth. Keep a few diced mango pieces for texture if preferred.",
        imagePath: "/recipes/mango.png",
      },
      {
        title: "Step 3 - Layer Parfait",
        description:
          "Layer chia pudding, mango puree, and yogurt. Top with mint and optional granola before serving.",
        imagePath: "/recipes/mango.png",
      },
    ],
  },
  "Herby Pasta Primavera": {
    detailDescription:
      "Herby Pasta Primavera is a colorful pasta dish loaded with seasonal vegetables, olive oil, lemon, and fresh herbs. It is bright, comforting, and perfect for a quick weeknight dinner with clean flavors.",
    ingredients: [
      "250 g pasta",
      "1 zucchini, sliced",
      "1 bell pepper, sliced",
      "1 cup cherry tomatoes",
      "2 cloves garlic, minced",
      "3 tbsp olive oil",
      "2 tbsp chopped parsley and basil",
      "Lemon zest and juice",
      "Salt and black pepper",
    ],
    tools: ["Large pot", "Saute pan", "Knife", "Cutting board", "Tongs"],
    instructionSteps: [
      {
        title: "Step 1 - Cook Pasta",
        description:
          "Boil pasta until al dente. Reserve some pasta water before draining.",
        imagePath: "/recipes/pasta.png",
      },
      {
        title: "Step 2 - Saute Vegetables",
        description:
          "Cook garlic and vegetables in olive oil until tender-crisp and fragrant.",
        imagePath: "/recipes/herby-pasta.png",
      },
      {
        title: "Step 3 - Combine and Finish",
        description:
          "Toss pasta with vegetables, herbs, lemon zest, and a splash of pasta water. Season and serve.",
        imagePath: "/recipes/herby-pasta.png",
      },
    ],
  },
  "Sweet Potato & Chickpea": {
    detailDescription:
      "Sweet Potato and Chickpea Bowl is a hearty plant-based meal with roasted vegetables, warm spices, and wholesome protein. It is nourishing, filling, and ideal for lunch or dinner meal prep.",
    ingredients: [
      "1 large sweet potato, cubed",
      "1 can chickpeas, rinsed",
      "2 tbsp olive oil",
      "1 tsp smoked paprika",
      "1/2 tsp cumin",
      "2 cups greens",
      "Cooked quinoa or rice",
      "Tahini or yogurt drizzle",
      "Salt and black pepper",
    ],
    tools: ["Sheet pan", "Mixing bowl", "Knife", "Cutting board", "Oven"],
    instructionSteps: [
      {
        title: "Step 1 - Roast Components",
        description:
          "Toss sweet potato and chickpeas with oil and spices, then roast until golden and crisp.",
        imagePath: "/recipes/potato.png",
      },
      {
        title: "Step 2 - Build the Bowl",
        description:
          "Add grains and greens to a bowl, then top with roasted sweet potato and chickpeas.",
        imagePath: "/recipes/meals.png",
      },
      {
        title: "Step 3 - Dress and Serve",
        description:
          "Finish with tahini or yogurt drizzle, then season to taste and serve warm.",
        imagePath: "/recipes/potato.png",
      },
    ],
  },
};

const NEW_FIELDS = [
  {
    id: "detailDescription",
    name: "Detail Description",
    type: "Text",
    required: false,
  },
  {
    id: "ingredients",
    name: "Ingredients",
    type: "Array",
    required: false,
    items: { type: "Symbol" },
  },
  {
    id: "tools",
    name: "Tools",
    type: "Array",
    required: false,
    items: { type: "Symbol" },
  },
  {
    id: "heroImage",
    name: "Hero Image",
    type: "Link",
    linkType: "Asset",
    required: false,
  },
  {
    id: "ingredientsImage",
    name: "Ingredients Image",
    type: "Link",
    linkType: "Asset",
    required: false,
  },
  {
    id: "toolsImage",
    name: "Tools Image",
    type: "Link",
    linkType: "Asset",
    required: false,
  },
  {
    id: "instructionSteps",
    name: "Instruction Steps",
    type: "Object",
    required: false,
  },
];

function ensureLocalized(fields, key, value) {
  return {
    ...fields,
    [key]: {
      ...(fields[key] || {}),
      [LOCALE]: value,
    },
  };
}

async function run() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("Missing CMA_CONTENTFUL or Contentful_space_id/CONTENTFUL_SPACE_ID");
    process.exit(1);
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log(`Using environment: ${ENVIRONMENT_ID}`);

  let recipeContentType = await environment.getContentType("recipe");
  const fieldIds = new Set(recipeContentType.fields.map((field) => field.id));

  let addedFields = 0;
  for (const field of NEW_FIELDS) {
    if (!fieldIds.has(field.id)) {
      recipeContentType.fields.push(field);
      addedFields += 1;
    }
  }

  if (addedFields > 0) {
    recipeContentType = await recipeContentType.update();
    await recipeContentType.publish();
    console.log(`Added and published ${addedFields} recipe fields.`);
  } else {
    console.log("Recipe content type already has required detail fields.");
  }

  const entries = await environment.getEntries({ content_type: "recipe", limit: 200 });

  let updated = 0;
  let skipped = 0;

  for (const entry of entries.items) {
    const title = entry.fields?.title?.[LOCALE];
    if (!title || !DETAIL_BY_TITLE[title]) {
      skipped += 1;
      continue;
    }

    const detail = DETAIL_BY_TITLE[title];
    const baseImage = entry.fields?.image?.[LOCALE] || null;

    let nextFields = entry.fields;
    nextFields = ensureLocalized(nextFields, "detailDescription", detail.detailDescription);
    nextFields = ensureLocalized(nextFields, "ingredients", detail.ingredients);
    nextFields = ensureLocalized(nextFields, "tools", detail.tools);
    nextFields = ensureLocalized(nextFields, "instructionSteps", detail.instructionSteps);

    if (baseImage) {
      nextFields = ensureLocalized(nextFields, "heroImage", baseImage);
      nextFields = ensureLocalized(nextFields, "ingredientsImage", baseImage);
      nextFields = ensureLocalized(nextFields, "toolsImage", baseImage);
    }

    entry.fields = nextFields;
    const updatedEntry = await entry.update();
    await updatedEntry.publish();
    updated += 1;
    console.log(`Updated recipe: ${title}`);
  }

  console.log("---");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
