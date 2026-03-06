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

// Define the header settings content type
const fields = [
  {
    id: "promotionBannerEnabled",
    name: "Promotion Banner Enabled",
    type: "Boolean",
    required: true,
  },
  {
    id: "promotionBannerText",
    name: "Promotion Banner Text",
    type: "Symbol",
    required: false,
  },
  {
    id: "promotionBannerBackgroundColor",
    name: "Promotion Banner Background Color",
    type: "Symbol",
    required: false,
  },
  {
    id: "promotionBannerTextColor",
    name: "Promotion Banner Text Color",
    type: "Symbol",
    required: false,
  },
  {
    id: "promotionBannerLink",
    name: "Promotion Banner Link (optional)",
    type: "Symbol",
    required: false,
  },
];

console.log("Creating or updating headerSettings content type...");

let contentType;
try {
  contentType = await environment.getContentType("headerSettings");
  console.log("Content type 'headerSettings' already exists. Updating...");
  
  // Add new fields that don't exist
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
  if (err.name === 'NotFound' || err.status === 404) {
    console.log(
      "Content type 'headerSettings' does not exist. Creating new..."
    );
    contentType = await environment.createContentTypeWithId("headerSettings", {
      name: "Header Settings",
      displayField: "promotionBannerText",
      fields,
    });
    console.log("Content type created successfully.");
  } else {
    throw err;
  }
}

await contentType.publish();
console.log("Content type published.");

// Create or update the entry
console.log("Creating or updating headerSettings entry...");

let entry;
try {
  const entries = await environment.getEntries({
    content_type: "headerSettings",
    limit: 1,
  });

  if (entries.items.length > 0) {
    entry = entries.items[0];
    console.log("Entry found. Updating...");

    entry.fields.promotionBannerEnabled = {
      [DEFAULT_LOCALE]: true,
    };
    entry.fields.promotionBannerText = {
      [DEFAULT_LOCALE]: "🎉 Special Offer: Get 20% off all premium recipes this week!",
    };
    entry.fields.promotionBannerBackgroundColor = {
      [DEFAULT_LOCALE]: "#00676E",
    };
    entry.fields.promotionBannerTextColor = {
      [DEFAULT_LOCALE]: "#FFFFFF",
    };
    entry.fields.promotionBannerLink = {
      [DEFAULT_LOCALE]: "/shop",
    };

    entry = await entry.update();
  } else {
    console.log("No entry found. Creating new...");
    entry = await environment.createEntry("headerSettings", {
      fields: {
        promotionBannerEnabled: {
          [DEFAULT_LOCALE]: true,
        },
        promotionBannerText: {
          [DEFAULT_LOCALE]: "🎉 Special Offer: Get 20% off all premium recipes this week!",
        },
        promotionBannerBackgroundColor: {
          [DEFAULT_LOCALE]: "#00676E",
        },
        promotionBannerTextColor: {
          [DEFAULT_LOCALE]: "#FFFFFF",
        },
        promotionBannerLink: {
          [DEFAULT_LOCALE]: "/shop",
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

console.log("\n✅ Header settings seeded successfully!");
console.log("You can now edit the promotion banner in Contentful CMS.");
