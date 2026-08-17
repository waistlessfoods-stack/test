import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const CONTENT_TYPE_ID = "homepage";
const DEFAULT_LOCALE = "en-US";
const DEFAULT_EYEBROW = "BOLD. SEASONAL. ARTFUL.";
const DEFAULT_HEADLINE = "PRIVATE DINING & CATERING";

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL and CONTENTFUL_SPACE_ID."
  );
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

let contentType = await environment.getContentType(CONTENT_TYPE_ID);
let contentTypeChanged = false;

const eyebrowField = contentType.fields.find(
  (field) => field.id === "heroEyebrow"
);

if (!eyebrowField) {
  const headlineIndex = contentType.fields.findIndex(
    (field) => field.id === "heroTitle"
  );
  const insertIndex = headlineIndex >= 0 ? headlineIndex : 0;

  contentType.fields.splice(insertIndex, 0, {
    id: "heroEyebrow",
    name: "HOMEPAGE — Eyebrow (Small Text Above Headline)",
    type: "Symbol",
    required: false,
  });
  contentTypeChanged = true;
  console.log("Added homepage.heroEyebrow.");
} else if (
  eyebrowField.name !== "HOMEPAGE — Eyebrow (Small Text Above Headline)"
) {
  eyebrowField.name = "HOMEPAGE — Eyebrow (Small Text Above Headline)";
  contentTypeChanged = true;
}

for (const fieldUpdate of [
  { id: "heroTitle", name: "HOMEPAGE — Main Headline" },
  { id: "heroSubtitle", name: "HOMEPAGE — Supporting Message" },
]) {
  const field = contentType.fields.find((item) => item.id === fieldUpdate.id);

  if (!field) {
    throw new Error(`Required existing field homepage.${fieldUpdate.id} was not found.`);
  }

  if (field.name !== fieldUpdate.name) {
    field.name = fieldUpdate.name;
    contentTypeChanged = true;
  }

  if (field.required) {
    field.required = false;
    contentTypeChanged = true;
  }
}

if (contentTypeChanged) {
  contentType = await contentType.update();
  contentType = await contentType.publish();
  console.log("Published the updated Homepage content model.");
} else {
  console.log("Homepage message fields are already configured.");
}

const editorInterface =
  await environment.getEditorInterfaceForContentType(CONTENT_TYPE_ID);
const controls = [...(editorInterface.controls ?? [])];
let controlsChanged = false;

const helpTextByField = {
  heroEyebrow:
    "Optional small text above the main headline, for example: BOLD. SEASONAL. ARTFUL.",
  heroTitle:
    "The large homepage headline, for example: PRIVATE DINING & CATERING or WASTE LESS. TASTE MORE. Line breaks are supported. If left empty, the website uses safe fallback copy.",
  heroSubtitle:
    "The supporting sentence below the headline, for example: Join our community for exclusive recipes, chef tips, and sustainable cooking inspiration. If left empty, the website uses safe fallback copy.",
};

for (const [fieldId, helpText] of Object.entries(helpTextByField)) {
  const controlIndex = controls.findIndex((control) => control.fieldId === fieldId);
  const currentControl = controlIndex >= 0 ? controls[controlIndex] : null;
  const nextControl = {
    fieldId,
    widgetId: fieldId === "heroSubtitle" ? "multipleLine" : "singleLine",
    widgetNamespace: "builtin",
    settings: {
      ...(currentControl?.settings ?? {}),
      helpText,
    },
  };
  const controlMatches =
    currentControl?.widgetId === nextControl.widgetId &&
    currentControl?.widgetNamespace === nextControl.widgetNamespace &&
    currentControl?.settings?.helpText === helpText;

  if (!controlMatches) {
    if (controlIndex >= 0) {
      controls[controlIndex] = nextControl;
    } else {
      controls.push(nextControl);
    }
    controlsChanged = true;
  }
}

if (controlsChanged) {
  editorInterface.controls = controls;
  await editorInterface.update();
  console.log("Updated Homepage editor labels and help text.");
}

const entries = await environment.getEntries({
  content_type: CONTENT_TYPE_ID,
  limit: 10,
});

if (entries.items.length !== 1) {
  throw new Error(
    `Expected one Homepage entry, but found ${entries.items.length}.`
  );
}

let entry = entries.items[0];

if (entry.isUpdated()) {
  throw new Error(
    "The Homepage entry has unpublished changes. Publish or discard them before running this migration."
  );
}

let entryChanged = false;
const currentHeadline = entry.fields.heroTitle?.[DEFAULT_LOCALE];
const currentEyebrow = entry.fields.heroEyebrow?.[DEFAULT_LOCALE];
const combinedHeadlinePattern = /^BOLD\.\s+SEASONAL\.\s+ARTFUL\.\s*/i;

if (!currentEyebrow) {
  entry.fields.heroEyebrow = { [DEFAULT_LOCALE]: DEFAULT_EYEBROW };
  entryChanged = true;
}

if (
  typeof currentHeadline === "string" &&
  combinedHeadlinePattern.test(currentHeadline)
) {
  const separatedHeadline = currentHeadline
    .replace(combinedHeadlinePattern, "")
    .trim();

  entry.fields.heroTitle = {
    [DEFAULT_LOCALE]: separatedHeadline || DEFAULT_HEADLINE,
  };
  entryChanged = true;
}

if (entryChanged) {
  entry = await entry.update();
  entry = await entry.publish();
  console.log("Published the Homepage entry with independently editable message fields.");
} else {
  console.log("Homepage entry copy is already separated and published.");
}

console.log("Homepage message editing is ready in Contentful.");
