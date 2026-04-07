import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const DEFAULT_LOCALE = "en-US";

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL and Contentful_space_id."
  );
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

const fields = [
  {
    id: "brandDescription",
    name: "Brand Description",
    type: "Text",
    required: false,
  },
  {
    id: "newsletterDescription",
    name: "Newsletter Description",
    type: "Text",
    required: false,
  },
  {
    id: "quickMenuDescription",
    name: "Quick Menu Description",
    type: "Text",
    required: false,
  },
  {
    id: "followUsDescription",
    name: "Follow Us Description",
    type: "Text",
    required: false,
  },
];

console.log("Creating or updating footerSettings content type...");

let contentType;
try {
  contentType = await environment.getContentType("footerSettings");
  console.log("Content type 'footerSettings' already exists. Updating...");

  fields.forEach((field) => {
    const existingField = contentType.fields.find((f) => f.id === field.id);
    if (!existingField) {
      contentType.fields.push(field);
      console.log(`Added field: ${field.id}`);
    }
  });

  contentType = await contentType.update();
  console.log("Content type updated successfully.");
} catch (err) {
  if (err.name === "NotFound" || err.status === 404) {
    console.log("Content type 'footerSettings' does not exist. Creating new...");
    contentType = await environment.createContentTypeWithId("footerSettings", {
      name: "Footer Settings",
      displayField: "brandDescription",
      fields,
    });
    console.log("Content type created successfully.");
  } else {
    throw err;
  }
}

await contentType.publish();
console.log("Content type published.");

console.log("Creating or updating footerSettings entry...");

let entry;
try {
  const entries = await environment.getEntries({
    content_type: "footerSettings",
    limit: 1,
  });

  if (entries.items.length > 0) {
    entry = entries.items[0];
    console.log("Entry found. Updating...");

    entry.fields.brandDescription = {
      [DEFAULT_LOCALE]:
        "Nourishing recipes and practical wellness support for your healthy lifestyle.",
    };
    entry.fields.newsletterDescription = {
      [DEFAULT_LOCALE]:
        "Get recipes, product updates, and wellness tips straight to your inbox.",
    };
    entry.fields.quickMenuDescription = {
      [DEFAULT_LOCALE]: "Explore our most visited pages.",
    };
    entry.fields.followUsDescription = {
      [DEFAULT_LOCALE]: "Stay connected for daily inspiration.",
    };

    entry = await entry.update();
  } else {
    console.log("No entry found. Creating new...");
    entry = await environment.createEntry("footerSettings", {
      fields: {
        brandDescription: {
          [DEFAULT_LOCALE]:
            "Nourishing recipes and practical wellness support for your healthy lifestyle.",
        },
        newsletterDescription: {
          [DEFAULT_LOCALE]:
            "Get recipes, product updates, and wellness tips straight to your inbox.",
        },
        quickMenuDescription: {
          [DEFAULT_LOCALE]: "Explore our most visited pages.",
        },
        followUsDescription: {
          [DEFAULT_LOCALE]: "Stay connected for daily inspiration.",
        },
      },
    });
  }

  await entry.publish();
  console.log("Entry published successfully!");
  console.log("Entry ID:", entry.sys.id);
} catch (err) {
  console.error("Error creating/updating entry:", err);
  throw err;
}

console.log("\nDone: Footer settings seeded successfully!");
console.log("You can now edit footer descriptions in Contentful CMS.");
