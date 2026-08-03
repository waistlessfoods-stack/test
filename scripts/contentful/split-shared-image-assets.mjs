import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;

dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id;
const ENVIRONMENT_ID = process.env.Contentful_environment || "master";
const DEFAULT_LOCALE = "en-US";

const TARGETS = [
  {
    label: "Zero Waste blog cover",
    entryId: "4uFA5DTl1Hw4U8iRXbXHyZ",
    fieldId: "coverImage",
    sourceAssetId: "nqfSj6qd43B3aoILNkdaa",
    clonedAssetTitle: "Zero Waste Blog Cover",
  },
  {
    label: "About Me supporting image",
    entryId: "5yViAqhwEO7H8GTnenEjZy",
    fieldId: "contentImage2",
    sourceAssetId: "4iU946xUqrb9yzebQYlYDg",
    clonedAssetTitle: "About Me Supporting Image",
  },
  {
    label: "Three Knives blog cover",
    entryId: "5KBG0hOYFVcBM37Fge36nu",
    fieldId: "coverImage",
    sourceAssetId: "7yqvKeQMyBVzHxKtDPWnsq",
    clonedAssetTitle: "Three Knives Blog Cover",
  },
  {
    label: "Homepage hero image 3",
    entryId: "7GMY196WvOBW2jOrJS4vUe",
    fieldId: "heroImages",
    sourceAssetId: "pgRKoR0NC4Bfdo83buqYK",
    clonedAssetTitle: "Homepage Hero Image 3",
    isArray: true,
  },
  {
    label: "Cooking Classes service thumbnail",
    entryId: "17YcmhnSoGH2i830nMacpW",
    fieldId: "thumbnailsImage",
    sourceAssetId: "7hjYyfjHaybbgpgj9uangd",
    clonedAssetTitle: "Cooking Classes Thumbnail",
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

async function cloneAsset(environment, sourceAssetId, title) {
  const existingAsset = await findAssetByExactTitle(environment, title);
  if (existingAsset) {
    console.log(`Reusing existing independent asset: ${title}`);
    return existingAsset;
  }

  const sourceAsset = await environment.getAsset(sourceAssetId);
  const sourceFile = sourceAsset.fields.file?.[DEFAULT_LOCALE];

  if (!sourceFile?.url || !sourceFile.fileName || !sourceFile.contentType) {
    throw new Error(`Source asset ${sourceAssetId} has no processed file.`);
  }

  const response = await fetch(
    sourceFile.url.startsWith("//") ? `https:${sourceFile.url}` : sourceFile.url
  );
  if (!response.ok) {
    throw new Error(
      `Unable to download source asset ${sourceAssetId}: ${response.status} ${response.statusText}`
    );
  }

  let clonedAsset = await environment.createAssetFromFiles({
    fields: {
      title: { [DEFAULT_LOCALE]: title },
      description: {
        [DEFAULT_LOCALE]: `Independent image asset for ${title}.`,
      },
      file: {
        [DEFAULT_LOCALE]: {
          file: await response.arrayBuffer(),
          contentType: sourceFile.contentType,
          fileName: sourceFile.fileName,
        },
      },
    },
  });

  clonedAsset = await clonedAsset.processForAllLocales({
    processingCheckWait: 1000,
    processingCheckRetries: 20,
  });
  clonedAsset = await clonedAsset.publish();

  console.log(`Created independent asset: ${title} (${clonedAsset.sys.id})`);
  return clonedAsset;
}

function getLinkedAssetIds(fieldValue, isArray) {
  if (isArray) {
    return Array.isArray(fieldValue)
      ? fieldValue.map((link) => link?.sys?.id).filter(Boolean)
      : [];
  }

  return fieldValue?.sys?.id ? [fieldValue.sys.id] : [];
}

async function relinkTarget(environment, target) {
  const clonedAsset = await cloneAsset(
    environment,
    target.sourceAssetId,
    target.clonedAssetTitle
  );
  const entry = await environment.getEntry(target.entryId);
  const currentValue = entry.fields[target.fieldId]?.[DEFAULT_LOCALE];
  const currentAssetIds = getLinkedAssetIds(currentValue, target.isArray);

  if (currentAssetIds.includes(clonedAsset.sys.id)) {
    console.log(`Already split: ${target.label}`);
    return;
  }

  if (!currentAssetIds.includes(target.sourceAssetId)) {
    throw new Error(
      `${target.label} no longer links to expected shared asset ${target.sourceAssetId}; refusing to overwrite it.`
    );
  }

  const hadUnpublishedChanges =
    typeof entry.sys.publishedVersion === "number" &&
    entry.sys.version > entry.sys.publishedVersion + 1;
  const wasPublished = typeof entry.sys.publishedVersion === "number";

  entry.fields[target.fieldId] = {
    ...entry.fields[target.fieldId],
    [DEFAULT_LOCALE]: target.isArray
      ? currentValue.map((link) =>
          link?.sys?.id === target.sourceAssetId
            ? assetLink(clonedAsset.sys.id)
            : link
        )
      : assetLink(clonedAsset.sys.id),
  };

  const updatedEntry = await entry.update();

  if (wasPublished && !hadUnpublishedChanges) {
    await updatedEntry.publish();
    console.log(`Split and published: ${target.label}`);
  } else {
    console.log(
      `Split in draft: ${target.label} (left unpublished to preserve existing draft changes)`
    );
  }
}

async function main() {
  assertConfiguration();

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  for (const target of TARGETS) {
    await relinkTarget(environment, target);
  }

  console.log("Shared image assets have been split successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
