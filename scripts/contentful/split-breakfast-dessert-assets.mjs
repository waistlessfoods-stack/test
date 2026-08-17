import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const LOCALE = "en-US";

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

function normalizeName(value) {
  return String(value || "").trim().toUpperCase();
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
      (asset) => asset.fields.title?.[LOCALE] === title
    ) || null
  );
}

async function cloneAsset(environment, sourceAsset, title) {
  const existing = await findAssetByExactTitle(environment, title);
  if (existing) {
    console.log(`Reusing existing asset: ${title}`);
    return existing;
  }

  const sourceFile = sourceAsset.fields.file?.[LOCALE];
  if (!sourceFile?.url || !sourceFile.fileName || !sourceFile.contentType) {
    throw new Error("The shared Breakfast/Dessert asset has no processed file.");
  }

  const sourceUrl = sourceFile.url.startsWith("//")
    ? `https:${sourceFile.url}`
    : sourceFile.url;
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to download the current category image: ${response.status} ${response.statusText}`
    );
  }

  let asset = await environment.createAssetFromFiles({
    fields: {
      title: { [LOCALE]: title },
      description: {
        [LOCALE]:
          "Independent image for the Breakfast recipe category. It may be replaced without changing Dessert.",
      },
      file: {
        [LOCALE]: {
          file: await response.arrayBuffer(),
          contentType: sourceFile.contentType,
          fileName: `breakfast-${sourceFile.fileName}`,
        },
      },
    },
  });

  asset = await asset.processForAllLocales({
    processingCheckWait: 1000,
    processingCheckRetries: 20,
  });
  asset = await asset.publish();
  console.log(`Created and published independent asset: ${title}`);
  return asset;
}

async function renameDessertAsset(asset) {
  const currentTitle = asset.fields.title?.[LOCALE];
  if (currentTitle === "Dessert Category Image") {
    return;
  }

  if (currentTitle !== "BREAKFAST") {
    console.log(
      `Kept existing Dessert asset title "${currentTitle}" to avoid overwriting an editorial change.`
    );
    return;
  }

  const wasPublished = typeof asset.sys.publishedVersion === "number";
  const hadUnpublishedChanges =
    wasPublished && asset.sys.version > asset.sys.publishedVersion + 1;

  asset.fields.title = {
    ...asset.fields.title,
    [LOCALE]: "Dessert Category Image",
  };
  asset.fields.description = {
    ...asset.fields.description,
    [LOCALE]:
      "Independent image for the Dessert recipe category. It may be replaced without changing Breakfast.",
  };

  const updated = await asset.update();
  if (wasPublished && !hadUnpublishedChanges) {
    await updated.publish();
    console.log("Renamed and published the Dessert category asset.");
  } else {
    console.log(
      "Renamed the Dessert asset in draft; existing unpublished changes still need review."
    );
  }
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);
const categoryResult = await environment.getEntries({
  content_type: "recipeCategory",
  limit: 100,
});
const categories = new Map(
  categoryResult.items.map((entry) => [
    normalizeName(entry.fields.name?.[LOCALE]),
    entry,
  ])
);
const breakfast = categories.get("BREAKFAST");
const dessert = categories.get("DESSERT");

if (!breakfast || !dessert) {
  throw new Error("Published Breakfast and Dessert category entries are required.");
}

const breakfastAssetId = breakfast.fields.image?.[LOCALE]?.sys?.id;
const dessertAssetId = dessert.fields.image?.[LOCALE]?.sys?.id;

if (!breakfastAssetId || !dessertAssetId) {
  throw new Error("Breakfast and Dessert must each have a linked image asset.");
}

if (breakfastAssetId !== dessertAssetId) {
  console.log("Breakfast and Dessert already use independent assets.");
  process.exit(0);
}

const sharedAsset = await environment.getAsset(breakfastAssetId);
const independentBreakfastAsset = await cloneAsset(
  environment,
  sharedAsset,
  "Breakfast Category Image"
);
const wasPublished = typeof breakfast.sys.publishedVersion === "number";
const hadUnpublishedChanges =
  wasPublished && breakfast.sys.version > breakfast.sys.publishedVersion + 1;

breakfast.fields.image = {
  ...breakfast.fields.image,
  [LOCALE]: assetLink(independentBreakfastAsset.sys.id),
};

const updatedBreakfast = await breakfast.update();
if (wasPublished && !hadUnpublishedChanges) {
  await updatedBreakfast.publish();
  console.log("Linked and published the independent Breakfast category image.");
} else {
  throw new Error(
    "Breakfast has existing unpublished changes. The independent image was linked in draft but was not published."
  );
}

await renameDessertAsset(sharedAsset);
console.log("Breakfast and Dessert image assets are now independent.");
