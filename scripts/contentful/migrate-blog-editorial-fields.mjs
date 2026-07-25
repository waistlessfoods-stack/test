#!/usr/bin/env node

import "dotenv/config";
import managementPkg from "contentful-management";

const { createClient } = managementPkg;

const SPACE_ID =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";
const CMA_TOKEN =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const CONTENT_TYPE_ID = "blogPost";
const DRY_RUN = process.argv.includes("--dry-run");

const APPROVED_CATEGORIES = [
  "Chef Inspiration",
  "Culinary Skills & Techniques",
  "Sustainable Cooking & Kitchen Tips",
];

const SLUG_HELP_TEXT =
  "Used in the public blog URL. Use lowercase words separated by hyphens, and avoid changing this value after publication.";

const ANSWER_HEADING_FIELD = {
  id: "triviaAnswerHeading",
  name: "Trivia Answer Heading",
  type: "Symbol",
  localized: false,
  required: false,
  disabled: false,
  omitted: false,
  validations: [{ size: { max: 120 } }],
};

const ANSWER_HEADING_BY_SLUG = new Map([
  [
    "the-3-knives-every-home-cook-actually-needs",
    "Trivia Answer: A — Did you guess correctly?",
  ],
  ["zero-waste-kitchen-guide", "Trivia Answer: B — Did you guess correctly?"],
  ["5-easy-meal-prep-ideas", "Trivia Answer: B — Did you guess correctly?"],
  [
    "the-chefs-guide-to-herbs",
    "Trivia Answer: B — Did you guess correctly?",
  ],
]);

function replaceValidation(validations, key, replacement) {
  return [
    ...(validations ?? []).filter((validation) => !(key in validation)),
    replacement,
  ];
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function upsertControl(controls, fieldId, defaults, settings) {
  const existingIndex = controls.findIndex(
    (control) => control.fieldId === fieldId
  );
  const existing =
    existingIndex >= 0 ? controls[existingIndex] : { fieldId, ...defaults };
  const next = {
    ...existing,
    ...defaults,
    settings: {
      ...(existing.settings ?? {}),
      ...settings,
    },
  };

  if (existingIndex >= 0) {
    controls[existingIndex] = next;
  } else {
    controls.push(next);
  }
}

async function populateEditorialValues(environment) {
  const entries = await environment.getEntries({
    content_type: CONTENT_TYPE_ID,
    limit: 100,
  });

  for (let entry of entries.items) {
    const slug = entry.fields.slug?.["en-US"];
    const heading = ANSWER_HEADING_BY_SLUG.get(slug);
    const existing = entry.fields.triviaAnswerHeading?.["en-US"];
    const shouldCorrectHerbCategory =
      (slug === "5-easy-meal-prep-ideas" ||
        slug === "the-chefs-guide-to-herbs") &&
      entry.fields.category?.["en-US"] === "Chef-Inspiration";
    const shouldSetHeading = Boolean(heading && existing !== heading);

    if (!shouldSetHeading && !shouldCorrectHerbCategory) {
      continue;
    }

    if (DRY_RUN) {
      console.log(`Dry run: would update editorial values for ${slug}.`);
      continue;
    }

    if (shouldSetHeading) {
      entry.fields.triviaAnswerHeading = {
        ...(entry.fields.triviaAnswerHeading ?? {}),
        "en-US": heading,
      };
    }

    if (shouldCorrectHerbCategory) {
      entry.fields.category = {
        ...(entry.fields.category ?? {}),
        "en-US": "Chef Inspiration",
      };
    }

    entry = await entry.update();
    await entry.publish();
    console.log(`Published the editorial values for ${slug}.`);
  }
}

async function migrate() {
  if (!SPACE_ID || !CMA_TOKEN) {
    throw new Error(
      "Missing Contentful_space_id/CONTENTFUL_SPACE_ID or CMA_CONTENTFUL/CONTENTFUL_MANAGEMENT_TOKEN."
    );
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);
  let contentType = await environment.getContentType(CONTENT_TYPE_ID);
  let contentTypeChanged = false;

  const categoryField = contentType.fields.find(
    (field) => field.id === "category"
  );
  if (!categoryField) {
    throw new Error("The blogPost content type has no category field.");
  }

  const nextCategoryValidations = replaceValidation(
    categoryField.validations,
    "in",
    { in: APPROVED_CATEGORIES }
  );
  if (!sameJson(categoryField.validations ?? [], nextCategoryValidations)) {
    categoryField.validations = nextCategoryValidations;
    contentTypeChanged = true;
    console.log("Prepared category allowed-values validation.");
  }

  if (
    !contentType.fields.some(
      (field) => field.id === ANSWER_HEADING_FIELD.id
    )
  ) {
    const triviaAnswerIndex = contentType.fields.findIndex(
      (field) => field.id === "triviaAnswer"
    );
    const insertAt =
      triviaAnswerIndex >= 0 ? triviaAnswerIndex : contentType.fields.length;
    contentType.fields.splice(insertAt, 0, ANSWER_HEADING_FIELD);
    contentTypeChanged = true;
    console.log("Prepared Trivia Answer Heading field.");
  }

  if (contentTypeChanged) {
    if (DRY_RUN) {
      console.log("Dry run: content type changes were not written.");
    } else {
      contentType = await contentType.update();
      await contentType.publish();
      console.log("Published the updated blogPost content type.");
    }
  } else {
    console.log("The blogPost content type already has the requested schema.");
  }

  if (DRY_RUN && contentTypeChanged) {
    console.log(
      "Dry run: editor controls were not inspected because the new field does not exist remotely yet."
    );
    return;
  }

  const editorInterface =
    await environment.getEditorInterfaceForContentType(CONTENT_TYPE_ID);
  const nextControls = [...(editorInterface.controls ?? [])];

  upsertControl(
    nextControls,
    "slug",
    { widgetId: "slugEditor", widgetNamespace: "builtin" },
    { helpText: SLUG_HELP_TEXT }
  );
  upsertControl(
    nextControls,
    "category",
    { widgetId: "dropdown", widgetNamespace: "builtin" },
    { helpText: "Choose one of the three approved blog categories." }
  );
  upsertControl(
    nextControls,
    ANSWER_HEADING_FIELD.id,
    { widgetId: "singleLine", widgetNamespace: "builtin" },
    {
      helpText:
        "Editable heading shown above the trivia answer, for example: Trivia Answer: B — Did you guess correctly?",
    }
  );

  if (sameJson(editorInterface.controls ?? [], nextControls)) {
    console.log("The blogPost editor controls already have the requested help text.");
  } else if (DRY_RUN) {
    console.log("Dry run: editor-interface changes were not written.");
  } else {
    editorInterface.controls = nextControls;
    await editorInterface.update();
    console.log("Updated the blogPost editor controls and help text.");
  }

  await populateEditorialValues(environment);
}

migrate().catch((error) => {
  console.error("Blog editorial-field migration failed:", error.message || error);
  process.exitCode = 1;
});
