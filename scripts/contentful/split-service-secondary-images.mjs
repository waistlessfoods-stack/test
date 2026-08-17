import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const LOCALE = "en-US";
const SERVICE_SLUGS = ["private", "catering", "cooking-classes"];

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

function assetLink(assetId) {
  return {
    sys: {
      type: "Link",
      linkType: "Asset",
      id: assetId,
    },
  };
}

function serviceLabel(entry) {
  return String(entry.fields.title?.[LOCALE] || entry.fields.slug?.[LOCALE]);
}

function secondaryField(entry) {
  const galleryImages = entry.fields.galleryImages?.[LOCALE];
  if (Array.isArray(galleryImages) && galleryImages.length > 0) {
    return { fieldId: "galleryImages", links: [...galleryImages] };
  }

  const subImages = entry.fields.subImages?.[LOCALE];
  return {
    fieldId: "subImages",
    links: Array.isArray(subImages) ? [...subImages] : [],
  };
}

async function getServiceEntries(environment) {
  const result = await environment.getEntries({
    content_type: "service",
    limit: 100,
  });
  const entries = new Map(
    result.items
      .filter((entry) => SERVICE_SLUGS.includes(entry.fields.slug?.[LOCALE]))
      .map((entry) => [entry.fields.slug[LOCALE], entry])
  );

  for (const slug of SERVICE_SLUGS) {
    if (!entries.has(slug)) {
      throw new Error(`Missing service entry: ${slug}`);
    }
  }

  return entries;
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

async function cloneAsset(environment, sourceAssetId, title, description) {
  const existing = await findAssetByExactTitle(environment, title);
  if (existing) {
    console.log(`Reusing existing independent asset: ${title}`);
    return existing;
  }

  const sourceAsset = await environment.getAsset(sourceAssetId);
  const sourceFile = sourceAsset.fields.file?.[LOCALE];
  if (!sourceFile?.url || !sourceFile.fileName || !sourceFile.contentType) {
    throw new Error(`Source asset ${sourceAssetId} has no processed file.`);
  }

  const sourceUrl = sourceFile.url.startsWith("//")
    ? `https:${sourceFile.url}`
    : sourceFile.url;
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Unable to download source asset ${sourceAssetId}: ${response.status} ${response.statusText}`
    );
  }

  let cloned = await environment.createAssetFromFiles({
    fields: {
      title: { [LOCALE]: title },
      description: { [LOCALE]: description },
      file: {
        [LOCALE]: {
          file: await response.arrayBuffer(),
          contentType: sourceFile.contentType,
          fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sourceFile.fileName}`,
        },
      },
    },
  });

  cloned = await cloned.processForAllLocales({
    processingCheckWait: 1000,
    processingCheckRetries: 20,
  });
  cloned = await cloned.publish();
  console.log(`Created and published: ${title}`);
  return cloned;
}

async function renameGenericAsset(asset, title, description) {
  const currentTitle = String(asset.fields.title?.[LOCALE] || "");
  if (currentTitle === title || !/^img-\d+$/i.test(currentTitle)) {
    return;
  }

  const wasPublished = typeof asset.sys.publishedVersion === "number";
  const hadUnpublishedChanges =
    wasPublished && asset.sys.version > asset.sys.publishedVersion + 1;
  if (hadUnpublishedChanges) {
    console.log(`Kept draft asset title: ${currentTitle}`);
    return;
  }

  asset.fields.title = { ...asset.fields.title, [LOCALE]: title };
  asset.fields.description = {
    ...asset.fields.description,
    [LOCALE]: description,
  };
  const updated = await asset.update();
  if (wasPublished) {
    await updated.publish();
  }
  console.log(`Renamed asset: ${currentTitle} -> ${title}`);
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);
let services = await getServiceEntries(environment);
const thumbnailIdsBefore = new Map();
const secondaryBySlug = new Map();
const usageByAssetId = new Map();

for (const [slug, entry] of services) {
  const hasDraft =
    typeof entry.sys.publishedVersion === "number" &&
    entry.sys.version > entry.sys.publishedVersion + 1;
  if (hasDraft) {
    throw new Error(
      `${serviceLabel(entry)} has unpublished changes. Resolve them before splitting images.`
    );
  }

  thumbnailIdsBefore.set(
    slug,
    entry.fields.thumbnailsImage?.[LOCALE]?.sys?.id || null
  );
  const secondary = secondaryField(entry);
  if (secondary.links.length === 0) {
    throw new Error(`${serviceLabel(entry)} has no gallery or sub-images.`);
  }
  secondaryBySlug.set(slug, secondary);

  secondary.links.forEach((link, index) => {
    const assetId = link?.sys?.id;
    if (!assetId) return;
    const usage = usageByAssetId.get(assetId) || [];
    usage.push({ slug, index });
    usageByAssetId.set(assetId, usage);
  });
}

const changedSlugs = new Set();

for (const [assetId, usage] of usageByAssetId) {
  if (usage.length < 2) continue;

  const keeper = usage.find((item) => item.slug === "catering") || usage[0];

  for (const item of usage) {
    if (item === keeper) continue;
    const entry = services.get(item.slug);
    const secondary = secondaryBySlug.get(item.slug);
    const title = `${serviceLabel(entry)} Secondary Image ${item.index + 1}`;
    const cloned = await cloneAsset(
      environment,
      assetId,
      title,
      `Independent secondary image for ${serviceLabel(entry)}. It may be replaced without changing another service.`
    );
    secondary.links[item.index] = assetLink(cloned.sys.id);
    changedSlugs.add(item.slug);
  }
}

for (const slug of changedSlugs) {
  const entry = services.get(slug);
  const secondary = secondaryBySlug.get(slug);
  entry.fields[secondary.fieldId] = {
    ...entry.fields[secondary.fieldId],
    [LOCALE]: secondary.links,
  };
  const updated = await entry.update();
  await updated.publish();
  console.log(`Published independent secondary images: ${serviceLabel(entry)}`);
}

services = await getServiceEntries(environment);
const finalAssetSets = new Map();

for (const [slug, entry] of services) {
  const thumbnailId =
    entry.fields.thumbnailsImage?.[LOCALE]?.sys?.id || null;
  if (thumbnailId !== thumbnailIdsBefore.get(slug)) {
    throw new Error(`Thumbnail changed unexpectedly for ${serviceLabel(entry)}.`);
  }

  const secondary = secondaryField(entry);
  const assetIds = secondary.links.map((link) => link?.sys?.id).filter(Boolean);
  finalAssetSets.set(slug, new Set(assetIds));

  for (let index = 0; index < assetIds.length; index += 1) {
    const asset = await environment.getAsset(assetIds[index]);
    await renameGenericAsset(
      asset,
      `${serviceLabel(entry)} Secondary Image ${index + 1}`,
      `Independent secondary image for ${serviceLabel(entry)}. It may be replaced without changing another service.`
    );
  }
}

for (let left = 0; left < SERVICE_SLUGS.length; left += 1) {
  for (let right = left + 1; right < SERVICE_SLUGS.length; right += 1) {
    const leftSlug = SERVICE_SLUGS[left];
    const rightSlug = SERVICE_SLUGS[right];
    const overlap = [...finalAssetSets.get(leftSlug)].filter((assetId) =>
      finalAssetSets.get(rightSlug).has(assetId)
    );
    if (overlap.length > 0) {
      throw new Error(
        `${leftSlug} and ${rightSlug} still share secondary assets: ${overlap.join(", ")}`
      );
    }
  }
}

if (changedSlugs.size === 0) {
  console.log("All service secondary images were already independent.");
} else {
  console.log("All service secondary images are now independent and published.");
}
console.log("Service thumbnails were verified unchanged.");
