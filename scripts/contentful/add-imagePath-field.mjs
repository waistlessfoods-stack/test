#!/usr/bin/env node

import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;
dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";
const LOCALE = "en-US";

async function run() {
  if (!CMA_TOKEN || !SPACE_ID) {
    console.error("Missing CMA_CONTENTFUL or Contentful_space_id");
    process.exit(1);
  }

  const client = createClient({ accessToken: CMA_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  console.log(`Using space: ${SPACE_ID}`);
  console.log(`Using environment: ${ENVIRONMENT_ID}\n`);

  try {
    let contentType = await environment.getContentType("blogPost");
    console.log("Current blogPost fields:", contentType.fields.map((f) => f.id));

    // Check if imagePath already exists
    const hasImagePath = contentType.fields.some((f) => f.id === "imagePath");
    if (hasImagePath) {
      console.log("\n✓ imagePath field already exists");
      return;
    }

    // Add imagePath field
    contentType.fields.push({
      id: "imagePath",
      name: "Image Path",
      type: "Symbol",
      required: false,
    });

    contentType = await contentType.update();
    await contentType.publish();
    console.log("\n✓ Added and published imagePath field");

    // Now update entries
    const imagesByTitle = {
      "5 Easy Meal Prep Ideas for Busy Weekdays":
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop",
      "The Science Behind Plant-Based Eating":
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
      "Zero Waste Kitchen: A Beginner's Guide":
        "https://images.unsplash.com/photo-1488537032205-618a7cea97e6?w=500&h=500&fit=crop",
    };

    const entries = await environment.getEntries({ content_type: "blogPost", limit: 100 });

    console.log("\nUpdating entries...\n");
    for (const entry of entries.items) {
      const title = entry.fields?.title?.[LOCALE];
      const imageUrl = imagesByTitle[title];

      if (imageUrl) {
        entry.fields.imagePath = { [LOCALE]: imageUrl };
        const updated = await entry.update();
        await updated.publish();
        console.log(`✓ Updated ${title}`);
      } else {
        console.log(`⨯ Skipped ${title} - no image mapping`);
      }
    }

    console.log("\n✓ Complete!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

run();
