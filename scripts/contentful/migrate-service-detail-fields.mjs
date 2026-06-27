#!/usr/bin/env node

import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;

const DEFAULT_LOCALE = "en-US";
const CMA_TOKEN =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

const DETAIL_FIELDS = [
  {
    id: "detailDescription",
    name: "Detail Description",
    type: "Text",
    required: false,
  },
  {
    id: "detailBenefits",
    name: "Detail Benefits",
    type: "Array",
    required: false,
    items: { type: "Symbol" },
  },
];

function localizedValue(fields, fieldId) {
  return fields?.[fieldId]?.[DEFAULT_LOCALE];
}

function setLocalizedValue(fields, fieldId, value) {
  return {
    ...fields,
    [fieldId]: {
      ...(fields?.[fieldId] || {}),
      [DEFAULT_LOCALE]: value,
    },
  };
}

function isBlankText(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function isBlankList(value) {
  return !Array.isArray(value) || value.length === 0;
}

async function run() {
  if (!CMA_TOKEN || !SPACE_ID) {
    throw new Error(
      "Missing Contentful credentials. Set CMA_CONTENTFUL and Contentful_space_id."
    );
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log(`Using Contentful environment: ${ENVIRONMENT_ID}`);

  let contentType = await environment.getContentType("service");
  const fieldIds = new Set(contentType.fields.map((field) => field.id));
  let contentTypeChanged = false;

  for (const desiredField of DETAIL_FIELDS) {
    if (!fieldIds.has(desiredField.id)) {
      const afterFieldId =
        desiredField.id === "detailDescription" ? "description" : "benefits";
      const afterIndex = contentType.fields.findIndex(
        (field) => field.id === afterFieldId
      );

      if (afterIndex >= 0) {
        contentType.fields.splice(afterIndex + 1, 0, desiredField);
      } else {
        contentType.fields.push(desiredField);
      }

      contentTypeChanged = true;
      console.log(`Added field: ${desiredField.id}`);
      continue;
    }

    const existingField = contentType.fields.find(
      (field) => field.id === desiredField.id
    );

    if (existingField && (existingField.disabled || existingField.omitted)) {
      existingField.disabled = false;
      existingField.omitted = false;
      contentTypeChanged = true;
      console.log(`Enabled field: ${desiredField.id}`);
    }
  }

  if (contentTypeChanged) {
    contentType = await contentType.update();
    await contentType.publish();
    console.log("Published service content type changes.");
  } else {
    console.log("Service content type already has detail fields.");
  }

  const entries = await environment.getEntries({
    content_type: "service",
    limit: 200,
  });

  let updatedEntries = 0;

  for (const entry of entries.items) {
    let nextFields = entry.fields || {};
    let entryChanged = false;
    const title = localizedValue(nextFields, "title") || entry.sys.id;
    const description = localizedValue(nextFields, "description");
    const benefits = localizedValue(nextFields, "benefits");
    const detailDescription = localizedValue(nextFields, "detailDescription");
    const detailBenefits = localizedValue(nextFields, "detailBenefits");

    if (isBlankText(detailDescription) && !isBlankText(description)) {
      nextFields = setLocalizedValue(
        nextFields,
        "detailDescription",
        description
      );
      entryChanged = true;
    }

    if (isBlankList(detailBenefits) && Array.isArray(benefits)) {
      nextFields = setLocalizedValue(nextFields, "detailBenefits", benefits);
      entryChanged = true;
    }

    if (!entryChanged) {
      console.log(`Skipped unchanged entry: ${title}`);
      continue;
    }

    entry.fields = nextFields;
    const updatedEntry = await entry.update();
    await updatedEntry.publish();
    updatedEntries += 1;
    console.log(`Initialized detail fields: ${title}`);
  }

  console.log("---");
  console.log(`Entries updated: ${updatedEntries}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
