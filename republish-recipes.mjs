#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

async function republishRecipes() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || 'master';

  if (!accessToken || !spaceId) {
    console.error('❌ Missing Contentful credentials');
    process.exit(1);
  }

  console.log('🔄 Republishing Recipe entries to apply schema changes...\n');

  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  const recipeIds = [
    '5r9nR40QveVb8dU021DqEh',
    '1dAoe4MLXKnjHIxfVku7JO',
    'WbAe1Q3Z3to7pdkq8zGgM',
    '5tJMp9856oOozUuc3jGVQ1',
    '64qW67XZubyRQy7qrxOJgm',
    '6KwuJxYGNZVdXaR9TUi6ny',
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const recipeId of recipeIds) {
    try {
      const entry = await environment.getEntry(recipeId);
      const updatedEntry = await entry.update();
      console.log(`✅ Republished: ${updatedEntry.fields.title?.['en-US']}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to republish ${recipeId}:`, error.message, '\n');
      failureCount++;
    }
  }

  console.log('---\n');
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
}

republishRecipes().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
