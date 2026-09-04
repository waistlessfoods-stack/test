#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import contentfulManagement from "contentful-management";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const { createClient } = contentfulManagement;
const APPLY_CHANGES = process.argv.includes("--apply");
const LOCALE = process.env.CONTENTFUL_LOCALE || "en-US";
const SPACE_ID =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";
const CMA_TOKEN =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const PASTA_CLASS_ID = "6KwuJxYGNZVdXaR9TUi6ny";

const ENTRY_LINK = (id) => ({
  sys: { type: "Link", linkType: "Entry", id },
});

const CATEGORY_IDS = {
  breakfast: "72tLpJOWd8DXAEygfY3thD",
  vegan: "6DEezgxPzHLr4YVOtqbrKU",
  healthyMeals: "5h6SSp1q3UO6ybKSZgjLTL",
};

const REPAIRS = [
  {
    id: "5r9nR40QveVb8dU021DqEh",
    title: "Triple Berry French Toast",
    slug: "triple-berry-french-toast",
    description:
      "Golden French toast topped with strawberries, blueberries, and raspberries for a bright, satisfying breakfast.",
    detailDescription:
      "Triple Berry French Toast pairs warm, cinnamon-scented brioche with a fresh mix of strawberries, blueberries, and raspberries. Finish it with maple syrup for an easy breakfast or brunch that feels special without being complicated.",
    categoryId: CATEGORY_IDS.breakfast,
    cookTime: "25 mins",
    servingSize: "4 servings",
    ingredients: [
      "8 slices brioche or thick-cut bread",
      "4 large eggs",
      "1 cup milk",
      "1 tsp vanilla extract",
      "1/2 tsp ground cinnamon",
      "Pinch of salt",
      "2 tbsp butter",
      "1 cup sliced strawberries",
      "1/2 cup blueberries",
      "1/2 cup raspberries",
      "Maple syrup, for serving",
    ],
    tools: ["Shallow bowl", "Whisk", "Large skillet", "Spatula", "Knife"],
    steps: [
      {
        title: "Step 1 - Prepare the Custard",
        description:
          "Whisk the eggs, milk, vanilla, cinnamon, and salt in a shallow bowl until smooth.",
      },
      {
        title: "Step 2 - Cook the French Toast",
        description:
          "Dip each bread slice in the custard, then cook in a buttered skillet over medium heat until golden on both sides.",
      },
      {
        title: "Step 3 - Add the Berries",
        description:
          "Top the warm French toast with strawberries, blueberries, and raspberries. Serve with maple syrup.",
      },
    ],
  },
  {
    id: "1dAoe4MLXKnjHIxfVku7JO",
    title: "Harvest-Stuffed Mushrooms",
    slug: "harvest-stuffed-mushrooms",
    description:
      "Roasted mushroom caps filled with quinoa, spinach, cranberries, and pecans for a savory seasonal bite.",
    detailDescription:
      "Harvest-Stuffed Mushrooms combine tender cremini caps with a colorful quinoa filling, wilted spinach, dried cranberries, toasted pecans, garlic, and thyme. They work as a plant-forward appetizer, side dish, or light meal.",
    categoryId: CATEGORY_IDS.healthyMeals,
    cookTime: "35 mins",
    servingSize: "4 servings",
    ingredients: [
      "12 large cremini mushroom caps",
      "1 cup cooked quinoa",
      "1 cup chopped spinach",
      "1/3 cup dried cranberries",
      "1/3 cup chopped pecans",
      "2 cloves garlic, minced",
      "2 tbsp olive oil",
      "1 tsp fresh thyme leaves",
      "Salt and black pepper",
    ],
    tools: ["Baking sheet", "Mixing bowl", "Skillet", "Knife", "Spoon"],
    steps: [
      {
        title: "Step 1 - Prepare the Mushrooms",
        description:
          "Remove the stems, brush the mushroom caps with olive oil, and arrange them cavity-side up on a baking sheet.",
      },
      {
        title: "Step 2 - Make the Filling",
        description:
          "Cook the garlic and spinach until wilted, then combine with quinoa, cranberries, pecans, thyme, salt, and pepper.",
      },
      {
        title: "Step 3 - Fill and Roast",
        description:
          "Spoon the filling into the mushroom caps and roast at 400°F until the mushrooms are tender and the tops are lightly browned.",
      },
    ],
  },
  {
    id: "WbAe1Q3Z3to7pdkq8zGgM",
    title: "Thai Red Vegetable Curry",
    slug: "thai-red-vegetable-curry",
    description:
      "Colorful vegetables simmered in a fragrant red curry coconut sauce with lime and basil.",
    detailDescription:
      "Thai Red Vegetable Curry is a comforting, plant-forward meal with crisp-tender vegetables in a creamy coconut sauce. Red curry paste brings warmth and depth, while lime and basil keep the finished dish fresh and balanced.",
    categoryId: CATEGORY_IDS.vegan,
    cookTime: "30 mins",
    servingSize: "4 servings",
    ingredients: [
      "1 tbsp neutral oil",
      "3 tbsp Thai red curry paste",
      "1 can full-fat coconut milk",
      "1 cup vegetable broth",
      "1 red bell pepper, sliced",
      "1 cup broccoli florets",
      "1 carrot, thinly sliced",
      "1 cup snap peas",
      "1 tbsp soy sauce or tamari",
      "1 tsp brown sugar",
      "Juice of 1 lime",
      "Fresh basil and cooked rice, for serving",
    ],
    tools: ["Large skillet or Dutch oven", "Wooden spoon", "Knife", "Cutting board"],
    steps: [
      {
        title: "Step 1 - Bloom the Curry Paste",
        description:
          "Warm the oil over medium heat and cook the red curry paste for about one minute, stirring until fragrant.",
      },
      {
        title: "Step 2 - Simmer the Vegetables",
        description:
          "Stir in the coconut milk and broth, then add the bell pepper, broccoli, carrot, and snap peas. Simmer until crisp-tender.",
      },
      {
        title: "Step 3 - Season and Serve",
        description:
          "Season with soy sauce, brown sugar, and lime juice. Finish with fresh basil and serve with rice.",
      },
    ],
  },
];

function textNode(value) {
  return {
    nodeType: "text",
    value,
    marks: [],
    data: {},
  };
}

function paragraph(value) {
  return {
    nodeType: "paragraph",
    data: {},
    content: [textNode(value)],
  };
}

function listDocument(items) {
  return {
    nodeType: "document",
    data: {},
    content: [
      {
        nodeType: "unordered-list",
        data: {},
        content: items.map((item) => ({
          nodeType: "list-item",
          data: {},
          content: [paragraph(item)],
        })),
      },
    ],
  };
}

function instructionsDocument(steps) {
  return {
    nodeType: "document",
    data: {},
    content: steps.flatMap((step) => [
      {
        nodeType: "heading-3",
        data: {},
        content: [textNode(step.title)],
      },
      paragraph(step.description),
    ]),
  };
}

function setLocalizedField(entry, availableFields, fieldId, value) {
  if (!availableFields.has(fieldId)) return false;
  entry.fields[fieldId] ||= {};
  entry.fields[fieldId][LOCALE] = value;
  return true;
}

function getLinkedEntryId(value) {
  return value?.sys?.id || null;
}

async function updateAndRepublish(entry) {
  const wasPublished = Boolean(entry.sys.publishedVersion);
  const updated = await entry.update();
  return wasPublished ? updated.publish() : updated;
}

function toPlainObject(entity) {
  return typeof entity.toPlainObject === "function"
    ? entity.toPlainObject()
    : entity;
}

async function main() {
  if (!SPACE_ID || !CMA_TOKEN) {
    throw new Error(
      "Missing Contentful CMA credentials. Set CMA_CONTENTFUL (or CONTENTFUL_MANAGEMENT_TOKEN) and CONTENTFUL_SPACE_ID."
    );
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);
  const recipeType = await environment.getContentType("recipe");
  const availableFields = new Set(recipeType.fields.map((field) => field.id));
  const recipeEntries = await Promise.all(
    REPAIRS.map((repair) => environment.getEntry(repair.id))
  );
  const pastaClass = await environment.getEntry(PASTA_CLASS_ID);
  const pageResults = await Promise.all(
    ["recipesPage", "shopPage"].map((contentType) =>
      environment.getEntries({ content_type: contentType, limit: 1 })
    )
  );
  const pageEntries = pageResults.flatMap((result) => result.items);

  console.log(
    APPLY_CHANGES
      ? "Applying Amber recipe repairs through Contentful CMA."
      : "Dry run only. Re-run with --apply to publish these repairs."
  );

  for (const [index, entry] of recipeEntries.entries()) {
    const repair = REPAIRS[index];
    console.log(
      `- ${entry.fields.title?.[LOCALE] || entry.sys.id} -> ${repair.title} (${repair.slug})`
    );
  }
  console.log(
    `- Remove and unpublish test class: ${pastaClass.fields.title?.[LOCALE] || PASTA_CLASS_ID}`
  );

  if (!APPLY_CHANGES) return;

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const backupDirectory = path.resolve(
    scriptDirectory,
    "../../.runtime/contentful-backups"
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    backupDirectory,
    `amber-recipe-repair-${timestamp}.json`
  );
  await mkdir(backupDirectory, { recursive: true });
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        spaceId: SPACE_ID,
        environmentId: ENVIRONMENT_ID,
        entries: [...recipeEntries, pastaClass, ...pageEntries].map(
          toPlainObject
        ),
      },
      null,
      2
    ),
    "utf8"
  );

  for (const [index, entry] of recipeEntries.entries()) {
    const repair = REPAIRS[index];
    const categoryLink = ENTRY_LINK(repair.categoryId);
    const fields = {
      title: repair.title,
      slug: repair.slug,
      description: repair.description,
      detailDescription: repair.detailDescription,
      ingredients: repair.ingredients,
      tools: repair.tools,
      instructionSteps: repair.steps,
      cookTime: repair.cookTime,
      servingSize: repair.servingSize,
      category: categoryLink,
      categories: [categoryLink],
      ingredientsRichText: listDocument(repair.ingredients),
      toolsRichText: listDocument(repair.tools),
      instructionsRichText: instructionsDocument(repair.steps),
    };

    for (const [fieldId, value] of Object.entries(fields)) {
      setLocalizedField(entry, availableFields, fieldId, value);
    }

    await updateAndRepublish(entry);
    console.log(`Published corrected recipe: ${repair.title}`);
  }

  for (const pageEntry of pageEntries) {
    const references = pageEntry.fields.recipes?.[LOCALE];
    if (!Array.isArray(references)) continue;

    const filteredReferences = references.filter(
      (reference) => getLinkedEntryId(reference) !== PASTA_CLASS_ID
    );
    if (filteredReferences.length === references.length) continue;

    pageEntry.fields.recipes[LOCALE] = filteredReferences;
    await updateAndRepublish(pageEntry);
    console.log(
      `Removed Pasta Making test reference from ${pageEntry.sys.contentType.sys.id}.`
    );
  }

  if (pastaClass.sys.publishedVersion) {
    await pastaClass.unpublish();
    console.log("Unpublished the Pasta Making test entry.");
  } else {
    console.log("Pasta Making test entry was already unpublished.");
  }

  console.log(`Backup written to ${backupPath}`);
}

main().catch((error) => {
  const status = error?.response?.status || error?.status;
  if (error?.name === "OrganizationAccessGrantRequired") {
    console.error(
      "Contentful accepted the CMA token, but its owner does not have access to the configured organization/space. Create the token while signed in as a member with edit/publish access to this space, then replace CMA_CONTENTFUL and retry."
    );
  } else if (status === 401 || error?.name === "AccessTokenInvalid") {
    console.error(
      "Contentful rejected the CMA token. Create a new Personal Access Token in Contentful and replace CMA_CONTENTFUL before retrying."
    );
  } else {
    console.error(error);
  }
  process.exit(1);
});
