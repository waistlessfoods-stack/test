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

async function ensureHeroImagesField() {
  let contentType = await environment.getContentType("homepage");
  const existingField = contentType.fields.find((field) => field.id === "heroImages");

  const heroImagesField = {
    id: "heroImages",
    name: "Hero Images",
    type: "Array",
    required: false,
    validations: [{ size: { max: 3 } }],
    items: {
      type: "Link",
      linkType: "Asset",
      validations: [{ linkMimetypeGroup: ["image"] }],
    },
  };

  if (!existingField) {
    contentType.fields.push(heroImagesField);
    contentType = await contentType.update();
    await contentType.publish();
    console.log("Added homepage.heroImages field with max 3 images.");
    return;
  }

  const updatedFields = contentType.fields.map((field) =>
    field.id === "heroImages" ? { ...field, ...heroImagesField } : field
  );

  contentType.fields = updatedFields;
  contentType = await contentType.update();
  await contentType.publish();
  console.log("Updated homepage.heroImages field validations (max 3 images).");
}

async function migrateHomepageEntries() {
  const entries = await environment.getEntries({
    content_type: "homepage",
    include: 1,
  });

  if (entries.items.length === 0) {
    console.log("No homepage entries found to migrate.");
    return;
  }

  for (const entry of entries.items) {
    const currentHeroImages = entry.fields.heroImages?.[DEFAULT_LOCALE] ?? [];
    const currentHeroImage = entry.fields.heroImage?.[DEFAULT_LOCALE] ?? null;

    const normalizedHeroImages = Array.isArray(currentHeroImages)
      ? currentHeroImages.slice(0, 3)
      : [];

    const nextHeroImages =
      normalizedHeroImages.length > 0
        ? normalizedHeroImages
        : currentHeroImage
          ? [currentHeroImage]
          : [];

    entry.fields.heroImages = {
      [DEFAULT_LOCALE]: nextHeroImages.slice(0, 3),
    };

    let updated = await entry.update();

    if (updated.isPublished()) {
      updated = await updated.publish();
    }

    console.log(
      `Migrated homepage entry ${updated.sys.id} with ${nextHeroImages.slice(0, 3).length} hero image(s).`
    );
  }
}

await ensureHeroImagesField();
await migrateHomepageEntries();

console.log("Homepage hero carousel migration complete.");
