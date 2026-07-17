#!/usr/bin/env node

import "dotenv/config";
import managementPkg from "contentful-management";
import { validateRichTextDocument } from "@contentful/rich-text-types";

const { createClient } = managementPkg;

const SPACE_ID =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";
const CMA_TOKEN =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const CONTENT_TYPE = "blogPost";
const TARGET_SLUG = "zero-waste-kitchen-guide";
const LOCALE = "en-US";
const ARTICLE_SUMMARY =
  "Simple steps to reduce food waste and create a more sustainable kitchen while saving money.";

if (!SPACE_ID || !CMA_TOKEN) {
  throw new Error(
    "Missing Contentful_space_id/CONTENTFUL_SPACE_ID or CMA_CONTENTFUL."
  );
}

function text(value, marks = []) {
  return { nodeType: "text", value, marks, data: {} };
}

function paragraph(value) {
  return {
    nodeType: "paragraph",
    data: {},
    content: Array.isArray(value) ? value : [text(value)],
  };
}

function heading2(value) {
  return {
    nodeType: "heading-2",
    data: {},
    content: [text(value)],
  };
}

function listItem(value) {
  return {
    nodeType: "list-item",
    data: {},
    content: [paragraph(value)],
  };
}

function unorderedList(items) {
  return {
    nodeType: "unordered-list",
    data: {},
    content: items.map(listItem),
  };
}

function tableCell(value, header = false) {
  return {
    nodeType: header ? "table-header-cell" : "table-cell",
    data: {},
    content: [paragraph(value)],
  };
}

function table(headers, rows) {
  return {
    nodeType: "table",
    data: {},
    content: [
      {
        nodeType: "table-row",
        data: {},
        content: headers.map((value) => tableCell(value, true)),
      },
      ...rows.map((row) => ({
        nodeType: "table-row",
        data: {},
        content: row.map((value) => tableCell(value)),
      })),
    ],
  };
}

function document(content) {
  return { nodeType: "document", data: {}, content };
}

const triviaQuestion = document([
  paragraph("Before you read on, let’s test your Food IQ!"),
  paragraph([
    text(
      "You're about to bake, but you notice the expiration date on your carton of eggs passed yesterday. What is the easiest, zero-waste way to test if an egg is still perfectly safe to eat without cracking it open?",
      [{ type: "bold" }]
    ),
  ]),
  paragraph("A) Shake it next to your ear to listen for a sloshing sound."),
  paragraph("B) Drop it in a glass of water to see if it sinks or floats."),
  paragraph("C) Hold it up to a bright flashlight to see through the shell."),
  paragraph("D) Roll it on the counter to see how fast it spins."),
]);

const fruitRows = [
  [
    "1. Apples",
    "Refrigerator",
    "Keep them loose in the crisper drawer. They emit high levels of ethylene gas, so keep them away from other produce to prevent premature spoiling.",
  ],
  [
    "2. Bananas",
    "Countertop",
    "Store them loose and away from direct sunlight. Pro-tip: Wrap the stems in plastic wrap to slow down the ripening process.",
  ],
  [
    "3. Berries (Strawberries, Blueberries, etc.)",
    "Refrigerator",
    "Moisture is the enemy of berries. Store them unwashed in their original container with a paper towel at the bottom to absorb moisture. Wash only right before eating.",
  ],
  [
    "4. Avocados",
    "Countertop to Fridge",
    "Leave them on the counter until they reach your desired level of ripeness, then transfer them to the fridge to halt the ripening process.",
  ],
  [
    "5. Tomatoes",
    "Countertop",
    "Never put tomatoes in the fridge! Cold temperatures destroy their texture and dull their flavor. Store them stem-side down on the counter.",
  ],
  [
    "6. Grapes",
    "Refrigerator",
    "Keep them in their ventilated plastic bag in the crisper drawer. Do not wash them until you are ready to eat them.",
  ],
  [
    "7. Citrus (Lemons, Limes, Oranges)",
    "Countertop or Fridge",
    "They will look beautiful on your counter for about a week, but if you want them to last up to a month, store them in a mesh bag in the refrigerator crisper.",
  ],
  [
    "8. Stone Fruits (Peaches, Plums)",
    "Countertop to Fridge",
    "Ripen them on the counter in a paper bag. Once they yield slightly to gentle pressure, move them to the fridge to preserve them.",
  ],
  [
    "9. Melons (Whole vs. Cut)",
    "Countertop, then Fridge",
    "Keep whole melons on the counter. Once sliced, tightly wrap the exposed flesh in beeswax wrap or plastic and store in the refrigerator.",
  ],
  [
    "10. Pears",
    "Countertop to Fridge",
    "Store at room temperature until ripe. To speed up ripening, put them in a paper bag with a banana. Move to the fridge once they are soft.",
  ],
];

const vegetableRows = [
  [
    "1. Garlic",
    "Pantry / Shelf",
    "Do not store garlic in the refrigerator. Keep whole heads on the shelf or in a pantry in a cool, dry, dark place with plenty of airflow (a mesh or paper bag is perfect).",
  ],
  [
    "2. Potatoes",
    "Pantry / Shelf",
    "Store in a cool, dark place. Crucial tip: Never store potatoes near onions! Onions release gases that make potatoes sprout and spoil rapidly.",
  ],
  [
    "3. Onions",
    "Pantry / Shelf",
    "Just like garlic, they love cool, dry, dark places with plenty of air circulation. Avoid plastic bags, which trap moisture and cause rot.",
  ],
  [
    "4. Carrots",
    "Refrigerator",
    "Cut off any green tops before storing, as they draw moisture away from the root. Store in a sealed container filled with water (change the water every few days) to keep them incredibly crisp.",
  ],
  [
    "5. Leafy Greens (Lettuce, Spinach)",
    "Refrigerator",
    "Wash, spin dry thoroughly, and store in a container lined with paper towels to absorb excess condensation.",
  ],
  [
    "6. Broccoli & Cauliflower",
    "Refrigerator",
    "Keep them in their original wrapping or a loosely closed plastic bag in the crisper drawer. They need room to breathe, so do not seal the bag tightly.",
  ],
  [
    "7. Bell Peppers",
    "Refrigerator",
    "Store them dry in your refrigerator's crisper drawer in a mesh or breathable bag. Moisture on the skin leads to mold.",
  ],
  [
    "8. Celery",
    "Refrigerator",
    "Wrap whole celery stalks tightly in aluminum foil. This allows the ethylene gas to escape while keeping the moisture in, keeping it crisp for weeks.",
  ],
  [
    "9. Cucumbers",
    "Refrigerator (Warm Zone)",
    "Cucumbers are sensitive to cold. Store them on the upper shelf of the fridge (which is slightly warmer than the bottom drawers) and keep them dry.",
  ],
  [
    "10. Fresh Herbs (except Basil)",
    "Refrigerator",
    "Treat parsley, cilantro, and dill like fresh flowers. Trim the stems, place them in a jar with an inch of water, cover loosely with a plastic bag, and refrigerate. (Note: Keep basil on the counter in water, as the fridge turns it black).",
  ],
];

const body = document([
  paragraph(
    "We’ve all been there: you open the crisper drawer with the best of intentions, only to find a container of mushy, fuzz-covered strawberries or a bunch of parsley that has completely withered and lost its vibrant green spark."
  ),
  paragraph(
    "Food waste isn't just a blow to our environmental conscience—it’s a direct hit to our wallets. In fact, the average family throws away thousands of dollars in unused groceries every year. But transitioning to a “zero-waste” kitchen doesn't require a lifestyle overhaul overnight. The single most effective step to immediately slashing your food waste is mastering proper storage."
  ),
  paragraph(
    "When we store our produce correctly, we don't just delay the inevitable; we actively preserve flavor, texture, and vital nutrients. The secret lies in understanding how different fruits and vegetables interact with temperature, moisture, and a natural ripening gas called ethylene."
  ),
  paragraph(
    "To help you get started, here is the ultimate cheat sheet for storing 10 of the most common fruits and 10 of the most common vegetables so they last as long as possible."
  ),
  heading2("The Top 10 Fruits: Storage Guide"),
  table(["Fruit", "Storage Location", "Best Practice"], fruitRows),
  heading2("The Top 10 Vegetables: Storage Guide"),
  table(["Vegetable", "Storage Location", "Best Practice"], vegetableRows),
  heading2("The Takeaway"),
  paragraph(
    "Making small adjustments to how you unpack your groceries takes less than five minutes, but it can extend the life of your fresh produce by days—or even weeks. Start with just a few of your weekly staples and watch how much longer they stay fresh!"
  ),
]);

const triviaAnswer = document([
  paragraph([
    text("This is known as the "),
    text('“Float Test!”', [{ type: "bold" }]),
    text(
      " Bad eggs accumulate air inside the shell over time. Expiration dates are often just estimates—this quick trick keeps you from accidentally wasting perfectly good eggs!"
    ),
  ]),
  unorderedList([
    [
      text("If it sinks to the bottom and lies flat on its side: ", [
        { type: "bold" },
      ]),
      text("It’s super fresh."),
    ],
    [
      text("If it stands upright on the bottom: ", [{ type: "bold" }]),
      text(
        "It’s older, but still perfectly safe to cook (and bonus: these make the absolute easiest-to-peel hard-boiled eggs!)."
      ),
    ],
    [
      text("If it floats to the top: ", [{ type: "bold" }]),
      text("It’s time to toss it."),
    ],
  ]),
]);

const documents = { triviaQuestion, body, triviaAnswer };

for (const [name, richTextDocument] of Object.entries(documents)) {
  const errors = validateRichTextDocument(richTextDocument);
  if (errors.length > 0) {
    throw new Error(`${name} failed rich-text validation: ${errors.join(", ")}`);
  }
}

const fieldDefinitions = [
  {
    id: "triviaQuestion",
    name: "Trivia Question",
    type: "RichText",
    localized: false,
    required: false,
    disabled: false,
    omitted: false,
    validations: [
      {
        enabledNodeTypes: [
          "heading-2",
          "heading-3",
          "paragraph",
          "unordered-list",
          "ordered-list",
        ],
      },
      { enabledMarks: ["bold", "italic", "underline"] },
    ],
  },
  {
    id: "body",
    name: "Article Body",
    type: "RichText",
    localized: false,
    required: false,
    disabled: false,
    omitted: false,
    validations: [
      {
        enabledNodeTypes: [
          "heading-2",
          "heading-3",
          "paragraph",
          "unordered-list",
          "ordered-list",
          "blockquote",
          "hr",
          "embedded-asset-block",
          "table",
        ],
      },
      { enabledMarks: ["bold", "italic", "underline"] },
    ],
  },
  {
    id: "triviaAnswer",
    name: "Trivia Answer",
    type: "RichText",
    localized: false,
    required: false,
    disabled: false,
    omitted: false,
    validations: [
      {
        enabledNodeTypes: [
          "heading-2",
          "heading-3",
          "paragraph",
          "unordered-list",
          "ordered-list",
        ],
      },
      { enabledMarks: ["bold", "italic", "underline"] },
    ],
  },
];

async function migrate() {
  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  let contentType = await environment.getContentType(CONTENT_TYPE);
  let contentTypeChanged = false;

  for (const definition of fieldDefinitions) {
    if (contentType.fields.some((field) => field.id === definition.id)) {
      console.log(`Field already exists: ${definition.id}`);
      continue;
    }

    contentType.fields.push(definition);
    contentTypeChanged = true;
    console.log(`Adding field: ${definition.id}`);
  }

  if (contentTypeChanged) {
    contentType = await contentType.update();
    await contentType.publish();
    console.log("Published the updated blogPost content type.");
  }

  const entries = await environment.getEntries({
    content_type: CONTENT_TYPE,
    "fields.slug": TARGET_SLUG,
    limit: 1,
  });
  const entry = entries.items[0];

  if (!entry) {
    throw new Error(`Could not find blog post with slug: ${TARGET_SLUG}`);
  }

  let entryChanged = false;

  const existingExcerpt = entry.fields.excerpt?.[LOCALE];
  if (
    typeof existingExcerpt === "string" &&
    existingExcerpt.includes("Something to Chew On | Trivia")
  ) {
    entry.fields.excerpt = { [LOCALE]: ARTICLE_SUMMARY };
    entryChanged = true;
    console.log("Restoring the article excerpt to its short summary.");
  }

  for (const [fieldId, richTextDocument] of Object.entries(documents)) {
    if (entry.fields[fieldId]?.[LOCALE]) {
      console.log(`Keeping existing editor content: ${fieldId}`);
      continue;
    }

    entry.fields[fieldId] = { [LOCALE]: richTextDocument };
    entryChanged = true;
    console.log(`Populating field: ${fieldId}`);
  }

  if (entryChanged) {
    const updatedEntry = await entry.update();
    await updatedEntry.publish();
    console.log(`Published article content for ${TARGET_SLUG}.`);
  } else {
    console.log("Article content is already populated; nothing to update.");
  }
}

migrate().catch((error) => {
  console.error("Blog article migration failed:", error.message || error);
  process.exitCode = 1;
});
