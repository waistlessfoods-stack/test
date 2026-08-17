import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const DEFAULT_LOCALE = "en-US";
const CONTENT_TYPE_ID = "authenticationSettings";

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

const fields = [
  {
    id: "internalName",
    name: "Entry Name (for Contentful only)",
    type: "Symbol",
    required: true,
  },
  {
    id: "image",
    name: "SIGN IN — Background Image",
    type: "Link",
    linkType: "Asset",
    required: false,
    validations: [{ linkMimetypeGroup: ["image"] }],
  },
  {
    id: "imageAltText",
    name: "SIGN IN — Image Description (Alt Text)",
    type: "Symbol",
    required: false,
  },
  {
    id: "signInImageHeading",
    name: "SIGN IN — Image Heading",
    type: "Text",
    required: false,
  },
  {
    id: "signInImageDescription",
    name: "SIGN IN — Image Supporting Text",
    type: "Text",
    required: false,
  },
  {
    id: "signInFormHeading",
    name: "SIGN IN — Form Heading",
    type: "Symbol",
    required: false,
  },
  {
    id: "signInFormDescription",
    name: "SIGN IN — Form Supporting Text",
    type: "Symbol",
    required: false,
  },
  {
    id: "signUpImage",
    name: "SIGN UP — Background Image",
    type: "Link",
    linkType: "Asset",
    required: false,
    validations: [{ linkMimetypeGroup: ["image"] }],
  },
  {
    id: "signUpImageAltText",
    name: "SIGN UP — Image Description (Alt Text)",
    type: "Symbol",
    required: false,
  },
  {
    id: "signUpImageHeading",
    name: "SIGN UP — Image Heading",
    type: "Text",
    required: false,
  },
  {
    id: "signUpImageDescription",
    name: "SIGN UP — Image Supporting Text",
    type: "Text",
    required: false,
  },
  {
    id: "signUpFormHeading",
    name: "SIGN UP — Form Heading",
    type: "Symbol",
    required: false,
  },
  {
    id: "signUpFormDescription",
    name: "SIGN UP — Form Supporting Text",
    type: "Symbol",
    required: false,
  },
];

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

let contentType;

try {
  contentType = await environment.getContentType(CONTENT_TYPE_ID);
  let changed = false;

  if (contentType.name !== "Sign In & Sign Up Pages") {
    contentType.name = "Sign In & Sign Up Pages";
    changed = true;
  }

  const description =
    "Images and marketing copy displayed on the customer Sign In and Sign Up pages.";
  if (contentType.description !== description) {
    contentType.description = description;
    changed = true;
  }

  for (const field of fields) {
    const existing = contentType.fields.find((item) => item.id === field.id);

    if (!existing) {
      contentType.fields.push(field);
      changed = true;
      console.log(`Added field: ${field.name}`);
      continue;
    }

    if (existing.name !== field.name) {
      existing.name = field.name;
      changed = true;
    }
  }

  if (changed) {
    contentType = await contentType.update();
  }
} catch (error) {
  if (error?.name !== "NotFound" && error?.status !== 404) {
    throw error;
  }

  contentType = await environment.createContentTypeWithId(CONTENT_TYPE_ID, {
    name: "Sign In & Sign Up Pages",
    description:
      "Images and marketing copy displayed on the customer Sign In and Sign Up pages.",
    displayField: "internalName",
    fields,
  });
  console.log("Created Authentication Settings content type.");
}

const contentTypeHasChanges =
  !contentType.sys.publishedVersion ||
  contentType.sys.version > contentType.sys.publishedVersion + 1;

if (contentTypeHasChanges) {
  contentType = await contentType.publish();
  console.log("Published Authentication Settings content type.");
}

const entries = await environment.getEntries({
  content_type: CONTENT_TYPE_ID,
  limit: 1,
});

let entry = entries.items[0];

if (!entry) {
  entry = await environment.createEntry(CONTENT_TYPE_ID, {
    fields: {
      internalName: { [DEFAULT_LOCALE]: "Sign In & Sign Up Page Content" },
      imageAltText: {
        [DEFAULT_LOCALE]: "Delicious food presentation",
      },
      signInImageHeading: { [DEFAULT_LOCALE]: "Waste Less.\nTaste More." },
      signInImageDescription: {
        [DEFAULT_LOCALE]:
          "Join our community for exclusive recipes, chef tips, and sustainable cooking inspiration.",
      },
      signInFormHeading: { [DEFAULT_LOCALE]: "Welcome Back" },
      signInFormDescription: {
        [DEFAULT_LOCALE]: "Sign in to continue your culinary journey",
      },
      signUpImageAltText: { [DEFAULT_LOCALE]: "Delicious recipes" },
      signUpImageHeading: { [DEFAULT_LOCALE]: "Join Our\nCommunity" },
      signUpImageDescription: {
        [DEFAULT_LOCALE]:
          "Get access to exclusive recipes, cooking tips, and sustainable living inspiration from Chef Amber.",
      },
      signUpFormHeading: { [DEFAULT_LOCALE]: "Create Account" },
      signUpFormDescription: {
        [DEFAULT_LOCALE]: "Start your journey to mindful, delicious cooking",
      },
    },
  });
  console.log("Created the shared authentication settings entry.");
} else {
  let entryChanged = false;
  const setFieldIfMissing = (fieldId, value) => {
    if (entry.fields[fieldId]?.[DEFAULT_LOCALE]) return;
    entry.fields[fieldId] = { [DEFAULT_LOCALE]: value };
    entryChanged = true;
  };

  if (
    entry.fields.internalName?.[DEFAULT_LOCALE] ===
    "Customer authentication pages"
  ) {
    entry.fields.internalName = {
      [DEFAULT_LOCALE]: "Sign In & Sign Up Page Content",
    };
    entryChanged = true;
  }

  if (
    entry.fields.imageAltText?.[DEFAULT_LOCALE] ===
    "WaistLess Foods culinary presentation"
  ) {
    entry.fields.imageAltText = {
      [DEFAULT_LOCALE]: "Delicious food presentation",
    };
    entryChanged = true;
  }

  setFieldIfMissing("signInImageHeading", "Waste Less.\nTaste More.");
  setFieldIfMissing(
    "signInImageDescription",
    "Join our community for exclusive recipes, chef tips, and sustainable cooking inspiration."
  );
  setFieldIfMissing("signInFormHeading", "Welcome Back");
  setFieldIfMissing(
    "signInFormDescription",
    "Sign in to continue your culinary journey"
  );
  setFieldIfMissing("signUpImageAltText", "Delicious recipes");
  setFieldIfMissing("signUpImageHeading", "Join Our\nCommunity");
  setFieldIfMissing(
    "signUpImageDescription",
    "Get access to exclusive recipes, cooking tips, and sustainable living inspiration from Chef Amber."
  );
  setFieldIfMissing("signUpFormHeading", "Create Account");
  setFieldIfMissing(
    "signUpFormDescription",
    "Start your journey to mindful, delicious cooking"
  );

  if (entryChanged) {
    entry = await entry.update();
    console.log("Updated the existing entry with clearly labeled page content.");
  }
}

const entryHasChanges =
  !entry.sys.publishedVersion ||
  entry.sys.version > entry.sys.publishedVersion + 1;

if (entryHasChanges) {
  entry = await entry.publish();
  console.log("Published the shared authentication settings entry.");
}

const uiConfig = await environment.getUIConfig();
const contentTypeFolder = uiConfig.entryListViews.find(
  (folder) => folder.title === "Content Type"
);

if (!contentTypeFolder) {
  throw new Error(
    'Could not find the shared "Content Type" sidebar folder in Contentful.'
  );
}

const existingSidebarView = contentTypeFolder.views.find(
  (view) =>
    view.contentTypeId === CONTENT_TYPE_ID ||
    view.contentTypeIds?.includes(CONTENT_TYPE_ID)
);

if (!existingSidebarView) {
  const homepageViewIndex = contentTypeFolder.views.findIndex(
    (view) =>
      view.contentTypeId === "homepage" ||
      view.contentTypeIds?.includes("homepage")
  );
  const insertIndex =
    homepageViewIndex >= 0
      ? homepageViewIndex + 1
      : contentTypeFolder.views.length;

  contentTypeFolder.views.splice(insertIndex, 0, {
    id: "signInSignUpPage",
    title: "Sign In & Sign Up Pages",
    contentTypeId: CONTENT_TYPE_ID,
    contentTypeIds: [CONTENT_TYPE_ID],
  });
  await uiConfig.update();
  console.log(
    'Added "Sign In & Sign Up Pages" to the shared Content Type sidebar folder.'
  );
} else {
  console.log(
    'The shared sidebar already includes "Sign In & Sign Up Pages".'
  );
}

console.log(
  "Sign In and Sign Up page content is ready for editing in Contentful."
);
