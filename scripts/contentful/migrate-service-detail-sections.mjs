import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;

const accessToken =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

const FIELD_ID = "detailSections";
const FIELD_DEFINITION = {
  id: FIELD_ID,
  name: "Detail Sections",
  type: "Object",
  required: false,
  localized: false,
  disabled: false,
  omitted: false,
  validations: [],
};

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL or CONTENTFUL_MANAGEMENT_TOKEN, and Contentful_space_id."
  );
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);
let contentType = await environment.getContentType("service");

const fields = contentType.fields ?? [];
const existingIndex = fields.findIndex((field) => field.id === FIELD_ID);

if (existingIndex >= 0) {
  const existing = fields[existingIndex];

  if (existing.type !== "Object") {
    throw new Error(
      `Cannot update '${FIELD_ID}' because it already exists as type '${existing.type}'.`
    );
  }

  fields[existingIndex] = {
    ...existing,
    name: FIELD_DEFINITION.name,
    required: false,
    localized: false,
    disabled: false,
    omitted: false,
    validations: existing.validations ?? [],
  };
} else {
  fields.push(FIELD_DEFINITION);
}

contentType.fields = fields;
contentType = await contentType.update();
await contentType.publish();

console.log(
  `Contentful service content type now includes optional Object field '${FIELD_ID}' in environment '${environmentId}'.`
);
