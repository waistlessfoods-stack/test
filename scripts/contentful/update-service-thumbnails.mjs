import pkg from "contentful-management";
import dotenv from "dotenv";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { createClient } = pkg;

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";
const PROJECT_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const THUMBNAILS = [
  {
    label: "Private Chef",
    entryId: "5mvYnsOh398Au2nyymHTzn",
    expectedCurrentAssetId: "2UaSbZpGJ64MBYDXCNzrSU",
    assetTitle: "Private Chef Service Thumbnail - Generated",
    filePath: "public/services/thumbnails/private-chef-generated.png",
  },
  {
    label: "Catering",
    entryId: "1Xjr4AyqPA7IGSBzwXzbCm",
    expectedCurrentAssetId: "7hjYyfjHaybbgpgj9uangd",
    assetTitle: "Catering Service Thumbnail - Generated",
    filePath: "public/services/thumbnails/catering-generated.png",
  },
  {
    label: "Cooking Classes",
    entryId: "17YcmhnSoGH2i830nMacpW",
    expectedCurrentAssetId: "5wZfDWj92MEOqXwpBjTtMx",
    assetTitle: "Cooking Classes Service Thumbnail - Generated",
    filePath: "public/services/thumbnails/cooking-classes-generated.png",
  },
];

function assertConfiguration() {
  if (!CMA_TOKEN || !SPACE_ID) {
    throw new Error(
      "Missing Contentful credentials. Set CMA_CONTENTFUL and Contentful_space_id."
    );
  }
}

function assetLink(assetId) {
  return {
    sys: {
      type: "Link",
      linkType: "Asset",
      id: assetId,
    },
  };
}

async function findAssetByExactTitle(environment, title) {
  const assets = await environment.getAssets({
    "fields.title": title,
    limit: 100,
  });

  return (
    assets.items.find(
      (asset) => asset.fields.title?.[DEFAULT_LOCALE] === title
    ) || null
  );
}

async function getOrUploadAsset(environment, thumbnail) {
  const existingAsset = await findAssetByExactTitle(
    environment,
    thumbnail.assetTitle
  );
  if (existingAsset) {
    console.log(`Reusing asset: ${thumbnail.assetTitle}`);
    return existingAsset;
  }

  const absoluteFilePath = resolve(PROJECT_ROOT, thumbnail.filePath);
  let asset = await environment.createAssetFromFiles({
    fields: {
      title: { [DEFAULT_LOCALE]: thumbnail.assetTitle },
      description: {
        [DEFAULT_LOCALE]:
          `Original AI-generated editorial image for the ${thumbnail.label} service card.`,
      },
      file: {
        [DEFAULT_LOCALE]: {
          file: createReadStream(absoluteFilePath),
          contentType: "image/png",
          fileName: thumbnail.filePath.split("/").at(-1),
        },
      },
    },
  });

  asset = await asset.processForAllLocales({
    processingCheckWait: 1000,
    processingCheckRetries: 20,
  });
  asset = await asset.publish();

  console.log(`Uploaded asset: ${thumbnail.assetTitle} (${asset.sys.id})`);
  return asset;
}

async function updateService(environment, thumbnail) {
  const asset = await getOrUploadAsset(environment, thumbnail);
  const entry = await environment.getEntry(thumbnail.entryId);
  const currentAssetId =
    entry.fields.thumbnailsImage?.[DEFAULT_LOCALE]?.sys?.id;

  if (currentAssetId === asset.sys.id) {
    console.log(`Already updated: ${thumbnail.label}`);
    return;
  }

  if (currentAssetId !== thumbnail.expectedCurrentAssetId) {
    throw new Error(
      `${thumbnail.label} no longer uses the expected thumbnail asset; refusing to overwrite a newer editorial choice.`
    );
  }

  const hadUnpublishedChanges =
    typeof entry.sys.publishedVersion === "number" &&
    entry.sys.version > entry.sys.publishedVersion + 1;
  const wasPublished = typeof entry.sys.publishedVersion === "number";

  entry.fields.thumbnailsImage = {
    ...entry.fields.thumbnailsImage,
    [DEFAULT_LOCALE]: assetLink(asset.sys.id),
  };

  const updatedEntry = await entry.update();

  if (wasPublished && !hadUnpublishedChanges) {
    await updatedEntry.publish();
    console.log(`Updated and published: ${thumbnail.label}`);
  } else {
    console.log(
      `Updated in draft: ${thumbnail.label} (preserved existing unpublished changes)`
    );
  }
}

async function main() {
  assertConfiguration();

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  for (const thumbnail of THUMBNAILS) {
    await updateService(environment, thumbnail);
  }

  console.log("Service thumbnails updated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
