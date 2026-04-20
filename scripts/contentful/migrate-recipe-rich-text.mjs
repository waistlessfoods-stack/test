/**
 * Migrates recipe content in Contentful from:
 *  - ingredients (array) + ingredientsImage (asset) → ingredientsRichText (Rich Text)
 *  - tools (array) + toolsImage (asset) → toolsRichText (Rich Text)
 *  - instructionSteps (JSON Object) → instructionsRichText (Rich Text)
 *
 * The old fields are kept so nothing breaks during the transition.
 * Once editors are comfortable, old fields can be deleted via a follow-up script.
 *
 * Run: node scripts/contentful/migrate-recipe-rich-text.mjs
 */

import pkg from "contentful-management";
const { createClient } = pkg;
import dotenv from "dotenv";

dotenv.config();

const SPACE_ID = process.env.Contentful_space_id;
const CMA_TOKEN = process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const ENVIRONMENT = process.env.Contentful_environment || "master";
const CONTENT_TYPE = "recipe";

if (!SPACE_ID || !CMA_TOKEN) {
  console.error("Missing Contentful_space_id or CMA_CONTENTFUL in .env");
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeText(value) {
  return { nodeType: "text", value: String(value), marks: [], data: {} };
}

function makeParagraph(text) {
  return {
    nodeType: "paragraph",
    data: {},
    content: [makeText(text)],
  };
}

function makeHeading3(text) {
  return {
    nodeType: "heading-3",
    data: {},
    content: [makeText(text)],
  };
}

function makeListItem(text) {
  return {
    nodeType: "list-item",
    data: {},
    content: [makeParagraph(text)],
  };
}

function makeUnorderedList(items) {
  return {
    nodeType: "unordered-list",
    data: {},
    content: items.map((item) => makeListItem(item)),
  };
}

function makeEmbeddedAsset(assetId) {
  return {
    nodeType: "embedded-asset-block",
    data: {
      target: {
        sys: {
          id: assetId,
          type: "Link",
          linkType: "Asset",
        },
      },
    },
    content: [],
  };
}

function makeDocument(contentNodes) {
  // Rich text documents must not be empty
  const nodes = contentNodes.length
    ? contentNodes
    : [makeParagraph("")];
  return { nodeType: "document", data: {}, content: nodes };
}

function buildIngredientsDoc(ingredientsArray, imageAssetId) {
  const nodes = [];
  if (imageAssetId) {
    nodes.push(makeEmbeddedAsset(imageAssetId));
  }
  if (ingredientsArray && ingredientsArray.length > 0) {
    nodes.push(makeUnorderedList(ingredientsArray));
  }
  return makeDocument(nodes);
}

function buildToolsDoc(toolsArray, imageAssetId) {
  const nodes = [];
  if (imageAssetId) {
    nodes.push(makeEmbeddedAsset(imageAssetId));
  }
  if (toolsArray && toolsArray.length > 0) {
    nodes.push(makeUnorderedList(toolsArray));
  }
  return makeDocument(nodes);
}

function buildInstructionsDoc(stepsArray) {
  const nodes = [];
  const steps = Array.isArray(stepsArray) ? stepsArray : [];
  for (const step of steps) {
    const title = step.title || step.stepTitle || "";
    const description = step.description || step.body || "";
    if (title) {
      nodes.push(makeHeading3(title));
    }
    if (description) {
      nodes.push(makeParagraph(description));
    }
  }
  return makeDocument(nodes);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Connecting to Contentful CMA…");
  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const env = await space.getEnvironment(ENVIRONMENT);

  // ── Step 1: Add new Rich Text fields to the content type ──────────────────
  console.log(`\nFetching content type: ${CONTENT_TYPE}`);
  const ct = await env.getContentType(CONTENT_TYPE);

  const fieldDefs = [
    {
      id: "ingredientsRichText",
      name: "Ingredients (Rich Text)",
      type: "RichText",
      required: false,
      localized: false,
      disabled: false,
      omitted: false,
      validations: [
        {
          enabledNodeTypes: [
            "heading-2", "heading-3",
            "unordered-list", "ordered-list",
            "embedded-asset-block",
            "paragraph",
          ],
        },
        { enabledMarks: ["bold", "italic", "underline"] },
      ],
    },
    {
      id: "toolsRichText",
      name: "Tools (Rich Text)",
      type: "RichText",
      required: false,
      localized: false,
      disabled: false,
      omitted: false,
      validations: [
        {
          enabledNodeTypes: [
            "heading-2", "heading-3",
            "unordered-list", "ordered-list",
            "embedded-asset-block",
            "paragraph",
          ],
        },
        { enabledMarks: ["bold", "italic", "underline"] },
      ],
    },
    {
      id: "instructionsRichText",
      name: "Instructions (Rich Text)",
      type: "RichText",
      required: false,
      localized: false,
      disabled: false,
      omitted: false,
      validations: [
        {
          enabledNodeTypes: [
            "heading-2", "heading-3",
            "ordered-list", "unordered-list",
            "embedded-asset-block",
            "paragraph",
            "hr",
          ],
        },
        { enabledMarks: ["bold", "italic", "underline"] },
      ],
    },
  ];

  let ctChanged = false;
  for (const fieldDef of fieldDefs) {
    const exists = ct.fields.find((f) => f.id === fieldDef.id);
    if (exists) {
      console.log(`  ✓ Field already exists: ${fieldDef.id}`);
    } else {
      console.log(`  + Adding field: ${fieldDef.id}`);
      ct.fields.push(fieldDef);
      ctChanged = true;
    }
  }

  if (ctChanged) {
    const updatedCt = await ct.update();
    await updatedCt.publish();
    console.log("  ✓ Content type updated and published");
  } else {
    // Fields exist in draft — ensure content type is published
    try {
      await ct.publish();
      console.log("  ✓ Content type published (was pending)");
    } catch (e) {
      if (e?.status === 409) {
        console.log("  ✓ Content type already up-to-date (no changes needed)");
      } else {
        throw e;
      }
    }
  }

  // ── Step 2: Migrate data in each recipe entry ─────────────────────────────
  console.log("\nFetching all recipe entries…");
  const entries = await env.getEntries({ content_type: CONTENT_TYPE, limit: 200 });
  console.log(`  Found ${entries.items.length} entries`);

  for (const entry of entries.items) {
    const title = entry.fields.title?.["en-US"] || "(no title)";
    console.log(`\nProcessing: ${title}`);

    const ingredients = entry.fields.ingredients?.["en-US"] || [];
    const tools = entry.fields.tools?.["en-US"] || [];
    const steps = entry.fields.instructionSteps?.["en-US"] || [];
    const ingredientsImageId = entry.fields.ingredientsImage?.["en-US"]?.sys?.id || null;
    const toolsImageId = entry.fields.toolsImage?.["en-US"]?.sys?.id || null;

    // Only update fields that haven't been manually edited yet
    const alreadyHasIngRichText = !!entry.fields.ingredientsRichText?.["en-US"];
    const alreadyHasToolsRichText = !!entry.fields.toolsRichText?.["en-US"];
    const alreadyHasInstRichText = !!entry.fields.instructionsRichText?.["en-US"];

    if (!alreadyHasIngRichText) {
      entry.fields.ingredientsRichText = {
        "en-US": buildIngredientsDoc(ingredients, ingredientsImageId),
      };
      console.log(`  ✓ ingredientsRichText  (${ingredients.length} items, image: ${ingredientsImageId ? "yes" : "no"})`);
    } else {
      console.log("  - ingredientsRichText already present, skipping");
    }

    if (!alreadyHasToolsRichText) {
      entry.fields.toolsRichText = {
        "en-US": buildToolsDoc(tools, toolsImageId),
      };
      console.log(`  ✓ toolsRichText  (${tools.length} items, image: ${toolsImageId ? "yes" : "no"})`);
    } else {
      console.log("  - toolsRichText already present, skipping");
    }

    if (!alreadyHasInstRichText) {
      entry.fields.instructionsRichText = {
        "en-US": buildInstructionsDoc(steps),
      };
      console.log(`  ✓ instructionsRichText  (${steps.length} steps)`);
    } else {
      console.log("  - instructionsRichText already present, skipping");
    }

    const updated = await entry.update();
    await updated.publish();
    console.log(`  ✓ Saved & published`);
  }

  console.log("\n✅ Migration complete!");
  console.log(
    "\nTip: In Contentful > Content model > Recipe, you can now hide (omit from API) the old fields:\n" +
      "  ingredients, tools, instructionSteps, heroImage, ingredientsImage, toolsImage\n" +
      "when you are ready (but keep them for now as backup)."
  );
}

main().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
