#!/usr/bin/env node

import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;
dotenv.config();

const CMA_TOKEN = process.env.CMA_CONTENTFUL;
const SPACE_ID = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";
const LOCALE = "en-US";

const SAMPLE_BLOG_POSTS = [
  {
    title: "5 Easy Meal Prep Ideas for Busy Weekdays",
    slug: "5-easy-meal-prep-ideas",
    excerpt: "Learn how to prepare healthy meals in advance with these simple and time-saving strategies that fit into any busy schedule.",
    category: "Healthy Living",
    readTimeMinutes: 5,
    imagePath: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop",
    sortOrder: 1,
  },
  {
    title: "The Science Behind Plant-Based Eating",
    slug: "science-plant-based-eating",
    excerpt: "Discover the nutritional benefits and environmental impact of transitioning to a plant-based diet.",
    category: "Nutrition",
    readTimeMinutes: 7,
    imagePath: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
    sortOrder: 2,
  },
  {
    title: "Zero Waste Kitchen: A Beginner's Guide",
    slug: "zero-waste-kitchen-guide",
    excerpt: "Simple steps to reduce food waste and create a more sustainable kitchen while saving money.",
    category: "Eco Living",
    readTimeMinutes: 6,
    imagePath: "https://images.unsplash.com/photo-1488537032205-618a7cea97e6?w=500&h=500&fit=crop",
    sortOrder: 3,
  },
];

async function createBlogPost(environment, post) {
  const entry = await environment.createEntry("blogPost", {
    fields: {
      title: { [LOCALE]: post.title },
      slug: { [LOCALE]: post.slug },
      excerpt: { [LOCALE]: post.excerpt },
      category: { [LOCALE]: post.category },
      readTimeMinutes: { [LOCALE]: post.readTimeMinutes },
      sortOrder: { [LOCALE]: post.sortOrder },
      publishedAt: { [LOCALE]: new Date().toISOString() },
    },
  });

  const published = await entry.publish();
  return published;
}

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
    // Check if content type exists
    await environment.getContentType("blogPost");
    console.log("✓ blogPost content type found\n");
  } catch (error) {
    console.error("✗ blogPost content type not found");
    console.error(
      "Please run the migration scripts to set up content types first."
    );
    process.exit(1);
  }

  // Check for existing entries
  const existing = await environment.getEntries({ content_type: "blogPost" });
  if (existing.items.length > 0) {
    console.log(`✓ Found ${existing.items.length} existing blog posts`);
    console.log("Skipping seed...\n");
    return;
  }

  console.log("Creating sample blog posts...\n");

  for (const post of SAMPLE_BLOG_POSTS) {
    try {
      const created = await createBlogPost(environment, post);
      console.log(`✓ Created: ${post.title}`);
    } catch (error) {
      console.error(`✗ Failed to create ${post.title}:`, error.message);
    }
  }

  console.log("\n✓ Blog seeding complete!");
}

run().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
