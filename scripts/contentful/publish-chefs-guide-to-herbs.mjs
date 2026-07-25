#!/usr/bin/env node

import "dotenv/config";
import managementPkg from "contentful-management";
import { createClient as createDeliveryClient } from "contentful";
import { validateRichTextDocument } from "@contentful/rich-text-types";

const { createClient: createManagementClient } = managementPkg;

const SPACE_ID =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";
const CMA_TOKEN =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const DELIVERY_TOKEN =
  process.env.CONTENTFUL_DELIVERY_TOKEN ||
  process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN;
const CONTENT_TYPE_ID = "blogPost";
const LOCALE = "en-US";
const VALIDATE_ONLY = process.argv.includes("--validate-only");
const DRY_RUN = process.argv.includes("--dry-run");

const LEGACY_SLUG = "5-easy-meal-prep-ideas";
const FINAL_SLUG = "the-chefs-guide-to-herbs";
const ARTICLE_TITLE =
  "The Chef’s Guide to Herbs: How to Layer Flavors & Elevate Everyday Meals";
const ARTICLE_EXCERPT =
  "Learn when to add woody and tender herbs, how to layer their flavors, and how to turn leftover herbs into a vibrant, waste-reducing herb oil.";
const ARTICLE_CATEGORY = "Chef Inspiration";
const ARTICLE_READ_TIME = 5;
const ARTICLE_SORT_ORDER = 1;
const ARTICLE_ANSWER_HEADING =
  "Trivia Answer: B — Did you guess correctly?";

const SORT_ORDER_BY_SLUG = new Map([
  [FINAL_SLUG, 1],
  ["zero-waste-kitchen-guide", 2],
  ["the-3-knives-every-home-cook-actually-needs", 3],
]);

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

function heading3(value) {
  return {
    nodeType: "heading-3",
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

function orderedList(items) {
  return {
    nodeType: "ordered-list",
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

function labeledText(label, value) {
  return [text(label, [{ type: "bold" }]), text(value)];
}

const triviaQuestion = document([
  paragraph("Before you read on, let’s test your Food IQ!"),
  paragraph([
    text(
      "You’re finishing a delicate summer pasta dish and want to add fresh basil. Which common preparation method actually causes delicate herbs like basil and mint to bruise, oxidize, and turn dark brown on your cutting board within minutes?",
      [{ type: "bold" }]
    ),
  ]),
  unorderedList([
    "A) Tearing the leaves by hand instead of cutting",
    "B) Dull knife blades or a saw-like dragging motion across the leaves",
    "C) Chiffonading the leaves while they are slightly damp",
    "D) Storing the cut herbs in cold water before garnishing",
  ]),
]);

const woodyHerbRows = [
  [
    "Thyme",
    "Earthy, subtle mint and lemon undertones",
    "A universal workhorse. Infuses deep savory richness into pan juices, roasted roots, and braises.",
  ],
  [
    "Rosemary",
    "Piney, resinous, woodsy, and bold",
    "Extremely potent. Excellent for high-heat roasting, infused fats, and hearty meats.",
  ],
  [
    "Sage",
    "Savory, peppery, with warm, eucalyptus notes",
    "Loves rich, buttery dishes, poultry, brown butter sauces, and autumnal root veggies.",
  ],
  [
    "Oregano",
    "Robust, pungent, slightly bitter, and peppery",
    "Core flavor in Mediterranean and Latin dishes; thrives in tomato sauces and marinades.",
  ],
  [
    "Bay Leaves",
    "Subtle floral, herbal, and tea-like aroma",
    "Slow-release flavor enhancer. Must be simmered in stews, stocks, braises, and grains.",
  ],
  [
    "Winter Savory",
    "Peppery, piney, and intensely savory",
    "Stronger than summer savory; ideal for heavy bean dishes, lentil soups, and gamey meats.",
  ],
];

const tenderHerbRows = [
  [
    "Basil",
    "Sweet, pepper-forward, subtle clove notes",
    "Pairs effortlessly with tomatoes, garlic, and summer produce. Best added raw or as a warm finish.",
  ],
  [
    "Cilantro",
    "Citrusy, pungent, sharp, and clean",
    "Cuts through rich, fatty, or spicy foods like a charm. Always use raw as a finishing burst.",
  ],
  [
    "Flat-Leaf Parsley",
    "Grassy, slightly bitter, fresh, and bright",
    "The ultimate balancing act. Acts as a natural palate cleanser to cut through heavy cream or butter.",
  ],
  [
    "Mint",
    "Cooling, sweet, sharp, and aromatic",
    "Cuts heaviness in roasted meats such as lamb, and elevates grain salads, cool yogurt dips, and fruit dressings.",
  ],
  [
    "Dill",
    "Feathery, anise-like, citrusy, and tangy",
    "Perfect partner for fish, pickles, potato salads, acidic dressings, and sour cream bases.",
  ],
  [
    "Chives",
    "Mild onion, delicate garlic sweetness",
    "Provides a subtle onion aroma without the harsh bite of raw onions. Ideal garnish for eggs, potatoes, and soups.",
  ],
  [
    "Tarragon",
    "Distinct licorice/anise, bittersweet, elegant",
    "Classic French herb; shines in poultry dishes, cream sauces, egg preparations, and vinaigrettes.",
  ],
];

const articleBody = document([
  heading2("Introduction"),
  paragraph(
    "Have you ever cooked a dish that tasted… fine, but felt like it was missing that vibrant depth you get at a great restaurant?"
  ),
  paragraph(
    "For years, many home cooks have treated fresh herbs like a last-minute garnish—something pretty to sprinkle over a plate right before serving. But in professional kitchens, chefs don’t just use herbs as a photo-worthy topping. We use them as flavor-building blocks at every stage of the cooking process."
  ),
  paragraph(
    "Learning how to properly layer herbs will transform your home cooking from flat to unforgettable. Here is how to master the art of herb layering, build incredible flavor profiles, and turn basic meals into restaurant-quality dishes."
  ),
  heading2("1. The Core Technique: Hard vs. Soft Herbs"),
  paragraph(
    "The golden rule of flavor layering comes down to understanding the physical structure of the herb. Herbs generally fall into two main categories, and knowing when to add them to the pan changes everything."
  ),
  heading3("Woody & Hard Herbs (The Infusers)"),
  unorderedList([
    labeledText(
      "The Herbs: ",
      "Thyme, Rosemary, Sage, Oregano, Bay Leaves, Winter Savory."
    ),
    labeledText(
      "The Technique: ",
      "These herbs have sturdy, pine-like leaves that can withstand high temperatures and long cooking times. Their essential oils are trapped deep within tough plant tissue, requiring heat and time to release."
    ),
    labeledText(
      "When to Add: ",
      "Early in the process. Sear them in oil or butter at the start of a dish, or let them simmer in soups, braises, and roasts to create a rich, foundational base note."
    ),
  ]),
  heading3("Tender & Soft Herbs (The Finishers)"),
  unorderedList([
    labeledText(
      "The Herbs: ",
      "Basil, Cilantro, Flat-Leaf Parsley, Mint, Dill, Chives, Tarragon."
    ),
    labeledText(
      "The Technique: ",
      "Soft herbs contain delicate essential oils that evaporate quickly when exposed to high, prolonged heat. If you cook them too long, their bright flavor vanishes and turns bitter."
    ),
    labeledText(
      "When to Add: ",
      "At the very end. Stir them in during the last 30 seconds of cooking, or scatter them fresh over the top just before serving to provide a clean, aromatic top note."
    ),
  ]),
  heading2("2. The Complete Herb Profile & Flavor Matrix"),
  heading3("Woody & Hard Herbs (Add Early)"),
  table(["Herb", "Flavor Profile", "Best Culinary Role"], woodyHerbRows),
  heading3("Tender & Soft Herbs (Add Late / Finishing)"),
  table(["Herb", "Flavor Profile", "Best Culinary Role"], tenderHerbRows),
  heading2("3. Chef’s Secret Technique: The Blanched Herb Oil"),
  paragraph(
    "Want to turn leftover soft herbs into an absolute flavor powerhouse that reduces kitchen waste? Make a blanched herb oil."
  ),
  paragraph(
    "When you blend raw basil or parsley into oil, it turns brown after a few hours because of oxidation. Chefs solve this with a quick 5-second blanch:"
  ),
  orderedList([
    labeledText(
      "Dunk: ",
      "Plunge your herbs into boiling water for 5 seconds."
    ),
    labeledText(
      "Shock: ",
      "Immediately transfer them to an ice bath to lock in their vibrant green chlorophyll."
    ),
    labeledText(
      "Squeeze & Blend: ",
      "Squeeze out every drop of excess water with a towel, then blend on high speed with extra virgin olive oil."
    ),
    labeledText(
      "Strain: ",
      "Pass it through a fine-mesh strainer or coffee filter."
    ),
  ]),
  paragraph(
    "You’re left with a stunning, emerald-green herb oil that lasts for weeks in the fridge—perfect for drizzling over grilled vegetables, soups, or roasted proteins!"
  ),
  heading2("The Takeaway"),
  paragraph(
    "Great cooking isn’t about accumulating dozens of obscure ingredients; it’s about knowing how to coax the maximum potential out of a few fresh ones. By layering sturdy herbs at the beginning of your cook and crowning your dishes with delicate herbs at the end, you’ll instantly unlock deeper, brighter, and more balanced flavors in your daily cooking."
  ),
]);

const triviaAnswer = document([
  paragraph([
    text("Dull knife blades! ", [{ type: "bold" }]),
    text(
      "When you slice herbs with a dull knife—or drag the blade back and forth in a saw-like motion—you crush the plant cells instead of cleanly severing them. This releases internal enzymes, causing them to react with oxygen and turn black or dark brown on the cutting board."
    ),
  ]),
  paragraph([
    text("Chef’s Pro Tip: ", [{ type: "bold" }]),
    text(
      "Always use your sharpest chef’s knife. Roll soft leaves like basil tightly for a chiffonade, then make one clean, single-pass slice through the herbs."
    ),
  ]),
]);

const richTextDocuments = {
  triviaQuestion,
  body: articleBody,
  triviaAnswer,
};

function validateDocuments() {
  for (const [fieldId, richTextDocument] of Object.entries(
    richTextDocuments
  )) {
    const errors = validateRichTextDocument(richTextDocument);
    if (errors.length > 0) {
      throw new Error(
        `${fieldId} failed rich-text validation: ${errors.join(", ")}`
      );
    }
  }

  console.log(
    `Validated herb article rich text: ${woodyHerbRows.length} woody herbs and ${tenderHerbRows.length} tender herbs.`
  );
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function localizedValue(entry, fieldId) {
  return entry.fields[fieldId]?.[LOCALE];
}

function setLocalizedValue(entry, fieldId, value) {
  if (sameJson(localizedValue(entry, fieldId), value)) {
    return false;
  }

  entry.fields[fieldId] = {
    ...(entry.fields[fieldId] ?? {}),
    [LOCALE]: value,
  };
  return true;
}

async function findExistingHerbEntry(environment) {
  for (const slug of [FINAL_SLUG, LEGACY_SLUG]) {
    const result = await environment.getEntries({
      content_type: CONTENT_TYPE_ID,
      "fields.slug": slug,
      limit: 2,
    });

    if (result.items.length > 1) {
      throw new Error(`Found multiple blog posts with slug: ${slug}`);
    }

    if (result.items[0]) {
      return result.items[0];
    }
  }

  const titleResult = await environment.getEntries({
    content_type: CONTENT_TYPE_ID,
    "fields.title": ARTICLE_TITLE,
    limit: 2,
  });

  if (titleResult.items.length > 1) {
    throw new Error(`Found multiple blog posts titled: ${ARTICLE_TITLE}`);
  }

  if (!titleResult.items[0]) {
    throw new Error(
      "Could not find the existing herb placeholder. The script will not create a duplicate entry."
    );
  }

  return titleResult.items[0];
}

async function updateHerbEntry(environment) {
  let entry = await findExistingHerbEntry(environment);
  let changed = false;

  changed = setLocalizedValue(entry, "title", ARTICLE_TITLE) || changed;
  changed = setLocalizedValue(entry, "slug", FINAL_SLUG) || changed;
  changed = setLocalizedValue(entry, "excerpt", ARTICLE_EXCERPT) || changed;
  changed = setLocalizedValue(entry, "category", ARTICLE_CATEGORY) || changed;
  changed =
    setLocalizedValue(entry, "readTimeMinutes", ARTICLE_READ_TIME) || changed;
  changed =
    setLocalizedValue(entry, "sortOrder", ARTICLE_SORT_ORDER) || changed;
  changed =
    setLocalizedValue(
      entry,
      "triviaAnswerHeading",
      ARTICLE_ANSWER_HEADING
    ) || changed;
  changed =
    setLocalizedValue(entry, "triviaQuestion", triviaQuestion) || changed;
  changed = setLocalizedValue(entry, "body", articleBody) || changed;
  changed = setLocalizedValue(entry, "triviaAnswer", triviaAnswer) || changed;

  if (!changed) {
    console.log("The herb article already matches the requested content.");
    return entry;
  }

  if (DRY_RUN) {
    console.log(
      `Dry run: would update existing herb entry ${entry.sys.id}; no content was written.`
    );
    return entry;
  }

  entry = await entry.update();
  entry = await entry.publish();
  console.log(`Published the herb article in existing entry ${entry.sys.id}.`);
  return entry;
}

async function normalizeBlogSortOrders(environment) {
  const entries = await environment.getEntries({
    content_type: CONTENT_TYPE_ID,
    limit: 100,
  });

  for (let entry of entries.items) {
    const slug = localizedValue(entry, "slug");
    const requestedOrder = SORT_ORDER_BY_SLUG.get(slug);

    if (
      requestedOrder === undefined ||
      localizedValue(entry, "sortOrder") === requestedOrder
    ) {
      continue;
    }

    if (DRY_RUN) {
      console.log(
        `Dry run: would set ${slug} to sort order ${requestedOrder}.`
      );
      continue;
    }

    setLocalizedValue(entry, "sortOrder", requestedOrder);
    entry = await entry.update();
    await entry.publish();
    console.log(`Published sort order ${requestedOrder} for ${slug}.`);
  }
}

function deliveryField(entry, fieldId) {
  return entry?.fields?.[fieldId];
}

function deliveryEntryMatches(entry) {
  return (
    deliveryField(entry, "title") === ARTICLE_TITLE &&
    deliveryField(entry, "slug") === FINAL_SLUG &&
    deliveryField(entry, "excerpt") === ARTICLE_EXCERPT &&
    deliveryField(entry, "category") === ARTICLE_CATEGORY &&
    deliveryField(entry, "readTimeMinutes") === ARTICLE_READ_TIME &&
    deliveryField(entry, "sortOrder") === ARTICLE_SORT_ORDER &&
    deliveryField(entry, "triviaAnswerHeading") === ARTICLE_ANSWER_HEADING &&
    Boolean(deliveryField(entry, "triviaQuestion")) &&
    Boolean(deliveryField(entry, "body")) &&
    Boolean(deliveryField(entry, "triviaAnswer"))
  );
}

async function verifyPublishedEntry() {
  if (!DELIVERY_TOKEN) {
    throw new Error(
      "Missing CONTENTFUL_DELIVERY_TOKEN/NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN; publication cannot be verified."
    );
  }

  const client = createDeliveryClient({
    space: SPACE_ID,
    accessToken: DELIVERY_TOKEN,
    environment: ENVIRONMENT_ID,
  });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = await client.getEntries({
      content_type: CONTENT_TYPE_ID,
      "fields.slug": FINAL_SLUG,
      include: 2,
      limit: 1,
    });
    const entry = result.items[0];

    if (entry && deliveryEntryMatches(entry)) {
      console.log(
        `Verified the published herb article through the delivery API on attempt ${attempt}.`
      );
      return;
    }

    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(
    "The delivery API did not return the complete published herb article after five attempts."
  );
}

async function publishArticle() {
  validateDocuments();

  if (VALIDATE_ONLY) {
    console.log("Validation-only mode complete; Contentful was not contacted.");
    return;
  }

  if (!SPACE_ID || !CMA_TOKEN) {
    throw new Error(
      "Missing Contentful_space_id/CONTENTFUL_SPACE_ID or CMA_CONTENTFUL/CONTENTFUL_MANAGEMENT_TOKEN."
    );
  }

  const client = createManagementClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);
  const contentType = await environment.getContentType(CONTENT_TYPE_ID);

  if (
    !contentType.fields.some(
      (field) => field.id === "triviaAnswerHeading"
    )
  ) {
    throw new Error(
      "Run scripts/contentful/migrate-blog-editorial-fields.mjs before publishing the herb article."
    );
  }

  await updateHerbEntry(environment);
  await normalizeBlogSortOrders(environment);

  if (DRY_RUN) {
    console.log("Dry run complete; no Contentful entries were written.");
    return;
  }

  await verifyPublishedEntry();
}

publishArticle().catch((error) => {
  console.error("Herb article publication failed:", error.message || error);
  process.exitCode = 1;
});
