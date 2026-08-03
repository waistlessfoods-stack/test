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
const FISH_ASSET_ID = "4iU946xUqrb9yzebQYlYDg";
const PROJECT_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const IMAGE_PATH = resolve(
  PROJECT_ROOT,
  "public/recipes/fish-seafood.png"
);

async function main() {
  if (!CMA_TOKEN || !SPACE_ID) {
    throw new Error(
      "Missing Contentful credentials. Set CMA_CONTENTFUL and Contentful_space_id."
    );
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);
  let asset = await environment.getAsset(FISH_ASSET_ID);
  const currentFile = asset.fields.file?.[DEFAULT_LOCALE];

  if (currentFile?.fileName === "fish-seafood.png") {
    console.log("Fish & Seafood category asset is already corrected.");
    return;
  }

  if (currentFile?.fileName !== "IMG_4634.jpeg") {
    throw new Error(
      `Fish & Seafood asset now uses unexpected file "${currentFile?.fileName}"; refusing to overwrite a newer editorial choice.`
    );
  }

  const upload = await environment.createUpload({
    file: createReadStream(IMAGE_PATH),
  });

  asset.fields.title = {
    ...asset.fields.title,
    [DEFAULT_LOCALE]: "Fish & Seafood",
  };
  asset.fields.description = {
    ...asset.fields.description,
    [DEFAULT_LOCALE]:
      "Whole roasted fish dish used for the Fish & Seafood recipe category.",
  };
  asset.fields.file = {
    ...asset.fields.file,
    [DEFAULT_LOCALE]: {
      contentType: "image/png",
      fileName: "fish-seafood.png",
      uploadFrom: {
        sys: {
          type: "Link",
          linkType: "Upload",
          id: upload.sys.id,
        },
      },
    },
  };

  asset = await asset.update();
  asset = await asset.processForAllLocales({
    processingCheckWait: 1000,
    processingCheckRetries: 20,
  });
  await asset.publish();

  console.log("Fish & Seafood category image corrected and published.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
