import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const DEFAULT_LOCALE = "en-US";

const accessToken =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId =
  process.env.Contentful_space_id ||
  process.env.CONTENTFUL_SPACE_ID ||
  process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL (or CONTENTFUL_MANAGEMENT_TOKEN) and Contentful_space_id."
  );
}

const linkByTitle = {
  "CHEF SERVICES": "/services",
  "RECIPES FOR EVERY MOOD": "/recipes",
  "BLOGS & ECO LIVING TIPS": "/links",
};

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

const homepageEntries = await environment.getEntries({
  content_type: "homepage",
  limit: 1,
});

if (!homepageEntries.items.length) {
  throw new Error("No homepage entry found.");
}

let homepage = homepageEntries.items[0];
const featureRefs = homepage.fields.features?.[DEFAULT_LOCALE] || [];

if (!Array.isArray(featureRefs) || !featureRefs.length) {
  throw new Error("No linked feature entries found on homepage.");
}

let updatedCount = 0;
for (const ref of featureRefs) {
  const featureId = ref?.sys?.id;
  if (!featureId) continue;

  let featureEntry = await environment.getEntry(featureId);
  const title = String(featureEntry.fields?.title?.[DEFAULT_LOCALE] || "").trim();
  const href = linkByTitle[title];

  if (!href) {
    console.log(`Skipping ${featureId} (${title}): no link mapping configured`);
    continue;
  }

  featureEntry.fields.buttonHref = { [DEFAULT_LOCALE]: href };
  featureEntry = await featureEntry.update();
  featureEntry = await featureEntry.publish();
  updatedCount += 1;

  console.log(`Updated ${title} -> ${href}`);
}

homepage = await environment.getEntry(homepage.sys.id);
homepage = await homepage.publish();

console.log(
  `Completed. Updated ${updatedCount} feature item(s). Homepage ${homepage.sys.id} republished in ${environmentId}.`
);
