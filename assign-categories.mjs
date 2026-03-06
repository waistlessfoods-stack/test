#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

const DEFAULT_LOCALE = 'en-US';

// Recipe to Category Mapping
const recipeMapping = {
  '5r9nR40QveVb8dU021DqEh': 'BREAKFAST', // Apple Peanut Donut Bites
  '1dAoe4MLXKnjHIxfVku7JO': 'DESSERT', // Almond Fudge Brownie
  'WbAe1Q3Z3to7pdkq8zGgM': 'FISH & SEAFOOD', // Creamy Tuna Roll
  '5tJMp9856oOozUuc3jGVQ1': 'DESSERT', // Mango Mint Chia Parfait
  '64qW67XZubyRQy7qrxOJgm': 'PASTA', // Herby Pasta Primavera
  '6KwuJxYGNZVdXaR9TUi6ny': 'VEGAN', // Sweet Potato & Chickpea
};

// Category name to ID mapping (from the check output)
const categoryNameToId = {
  'BEEF': '3S8zx81g9x2TsMLlqJBknw',
  'FISH & SEAFOOD': '41rEuhwI0076eOdPSE40KH',
  'PASTA': 'sJXG7LAzurPXG1WRBRKku',
  'HEALTHY MEALS': '5h6SSp1q3UO6ybKSZgjLTL',
  'DESSERT': '2xzxlFABshnRuWOfX5el8E',
  'VEGAN': '6DEezgxPzHLr4YVOtqbrKU',
  'BREAKFAST': '64pkMVm8Qjex7RF9muDi8N',
};

async function assignCategories() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || 'master';

  if (!accessToken || !spaceId) {
    console.error('❌ Missing Contentful credentials');
    process.exit(1);
  }

  console.log('🔄 Assigning categories to recipes...\n');

  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  let successCount = 0;
  let failureCount = 0;

  for (const [recipeId, categoryName] of Object.entries(recipeMapping)) {
    try {
      const recipe = await environment.getEntry(recipeId);
      const categoryId = categoryNameToId[categoryName];

      if (!categoryId) {
        console.log(`❌ Recipe: ${recipe.fields.title?.[DEFAULT_LOCALE]}`);
        console.log(`   Category "${categoryName}" not found\n`);
        failureCount++;
        continue;
      }

      // Initialize fields.category if it doesn't exist
      if (!recipe.fields.category) {
        recipe.fields.category = {};
      }

      // Update the recipe with the category reference
      recipe.fields.category[DEFAULT_LOCALE] = {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: categoryId,
        },
      };

      // Save the updated recipe
      const updatedRecipe = await recipe.update();
      console.log(`✅ ${recipe.fields.title?.[DEFAULT_LOCALE]}`);
      console.log(`   → ${categoryName}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to update recipe ${recipeId}:`, error.message, '\n');
      failureCount++;
    }
  }

  console.log('---\n');
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
}

assignCategories().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
