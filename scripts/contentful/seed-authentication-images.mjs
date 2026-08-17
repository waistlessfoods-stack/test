import "dotenv/config";
import { createReadStream } from "node:fs";
import { basename, resolve } from "node:path";
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

const targets = [
  {
    fieldId: "image",
    filePath: resolve("public/about/food-img.png"),
    title: "Sign In Page Background",
    description: "Food background currently used on the WaistLess Foods Sign In page.",
  },
  {
    fieldId: "signUpImage",
    filePath: resolve("public/highlight/recipe.png"),
    title: "Sign Up Page Background",
    description: "Recipe background currently used on the WaistLess Foods Sign Up page.",
  },
];

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

async function uploadAsset(environment, target) {
  const existing = await findAssetByExactTitle(environment, target.title);

  if (existing) {
    console.log(`Reusing existing asset: ${target.title}`);
    return existing;
  }

  const upload = await environment.createUpload({
    file: createReadStream(target.filePath),
  });

  let asset = await environment.createAsset({
    fields: {
      title: { [DEFAULT_LOCALE]: target.title },
      description: { [DEFAULT_LOCALE]: target.description },
      file: {
        [DEFAULT_LOCALE]: {
          contentType: "image/png",
          fileName: basename(target.filePath),
          uploadFrom: {
            sys: {
              type: "Link",
              linkType: "Upload",
              id: upload.sys.id,
            },
          },
        },
      },
    },
  });

  asset = await asset.processForAllLocales({
    processingCheckWait: 1000,
    processingCheckRetries: 20,
  });
  asset = await asset.publish();
  console.log(`Uploaded and published: ${target.title}`);
  return asset;
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);
const entries = await environment.getEntries({
  content_type: CONTENT_TYPE_ID,
  limit: 1,
});
let entry = entries.items[0];

if (!entry) {
  throw new Error(
    "The Sign In & Sign Up Page Content entry is missing. Run migrate-authentication-settings.mjs first."
  );
}

const wasPublished = typeof entry.sys.publishedVersion === "number";
const hadUnpublishedChanges =
  wasPublished && entry.sys.version > entry.sys.publishedVersion + 1;
let changed = false;

for (const target of targets) {
  const asset = await uploadAsset(environment, target);
  const currentAssetId =
    entry.fields[target.fieldId]?.[DEFAULT_LOCALE]?.sys?.id;

  if (currentAssetId === asset.sys.id) {
    continue;
  }

  entry.fields[target.fieldId] = {
    [DEFAULT_LOCALE]: assetLink(asset.sys.id),
  };
  changed = true;
}

if (changed) {
  entry = await entry.update();

  if (wasPublished && !hadUnpublishedChanges) {
    entry = await entry.publish();
    console.log("Attached both images and published the page-content entry.");
  } else {
    console.log(
      "Attached both images in draft. Existing unpublished edits were preserved and still need review before publishing."
    );
  }
} else {
  console.log("Both authentication images are already attached.");
}
