import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const DEFAULT_LOCALE = "en-US";

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL and Contentful_space_id."
  );
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

const featureCopy = [
  {
    title: "CHEF SERVICES",
    description:
      "Enjoy personalized culinary experiences designed around your needs - from private dining and catering to hands-on cooking classes. Thoughtful menus, fresh ingredients, and memorable moments made simple.",
    imagePath: "/highlight/meet-chef.png",
    buttonLabel: "More Info",
    sortOrder: 1,
  },
  {
    title: "RECIPES FOR EVERY MOOD",
    description:
      "Discover delicious recipes for every occasion - from quick everyday meals to nourishing dishes worth sharing. Simple ingredients, balanced flavors, and easy inspiration for your kitchen.",
    imagePath: "/highlight/recipe.png",
    buttonLabel: "More Info",
    sortOrder: 2,
  },
  {
    title: "BLOGS & ECO LIVING TIPS",
    description:
      "Explore helpful articles on mindful cooking, sustainable habits, kitchen tips, and healthy living. Practical ideas to help you live well and waste less every day.",
    imagePath: "/highlight/eco-living.png",
    buttonLabel: "More Info",
    sortOrder: 3,
  },
];

const homepageEntries = await environment.getEntries({ content_type: "homepage", limit: 1 });
if (!homepageEntries.items.length) {
  throw new Error("No homepage entry found. Seed homepage first.");
}

let homepage = homepageEntries.items[0];

homepage.fields.featuresHeading = {
  [DEFAULT_LOCALE]: "SIMPLE. SUSTAINABLE. DELICIOUS.",
};
homepage.fields.featuresIntro = {
  [DEFAULT_LOCALE]:
    "We make healthy, eco-conscious eating easy for everyone through chef services, delicious recipes, and practical lifestyle inspiration.",
};

const featureRefs = homepage.fields.features?.[DEFAULT_LOCALE] || [];
if (!Array.isArray(featureRefs) || featureRefs.length < 3) {
  throw new Error("Homepage needs at least 3 linked feature items.");
}

const linkedFeatureIds = featureRefs
  .map((ref) => ref?.sys?.id)
  .filter(Boolean)
  .slice(0, 3);

const updatedFeatureRefs = [];
for (let i = 0; i < linkedFeatureIds.length; i += 1) {
  const featureId = linkedFeatureIds[i];
  const nextCopy = featureCopy[i];

  let featureEntry = await environment.getEntry(featureId);
  featureEntry.fields.title = { [DEFAULT_LOCALE]: nextCopy.title };
  featureEntry.fields.description = { [DEFAULT_LOCALE]: nextCopy.description };
  featureEntry.fields.imagePath = { [DEFAULT_LOCALE]: nextCopy.imagePath };
  featureEntry.fields.buttonLabel = { [DEFAULT_LOCALE]: nextCopy.buttonLabel };
  featureEntry.fields.sortOrder = { [DEFAULT_LOCALE]: nextCopy.sortOrder };

  featureEntry = await featureEntry.update();

  if (featureEntry.isPublished()) {
    featureEntry = await featureEntry.publish();
  } else {
    featureEntry = await featureEntry.publish();
  }

  updatedFeatureRefs.push({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: featureEntry.sys.id,
    },
  });

  console.log(`Updated feature item ${i + 1}: ${nextCopy.title}`);
}

homepage.fields.features = {
  [DEFAULT_LOCALE]: updatedFeatureRefs,
};

homepage = await homepage.update();
if (homepage.isPublished()) {
  homepage = await homepage.publish();
} else {
  homepage = await homepage.publish();
}

console.log("Updated homepage features heading/intro and 3 feature cards.");
