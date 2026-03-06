#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

const DEFAULT_LOCALE = 'en-US';

async function checkCategories() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || 'master';

  if (!accessToken || !spaceId) {
    console.error('Missing Contentful credentials');
    process.exit(1);
  }

  console.log('Fetching Contentful data...');
  console.log('Space ID:', spaceId);
  console.log('Environment:', environmentId);
  console.log('---\n');

  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  // Get recipes page
  const recipesPageEntries = await environment.getEntries({
    content_type: 'recipesPage',
    limit: 1,
  });

  const recipesPageEntry = recipesPageEntries.items[0];
  
  if (!recipesPageEntry) {
    console.log('❌ No recipes page entry found');
    return;
  }

  console.log('✅ Recipes Page Entry Found\n');

  // Get categories
  const categoryRefs = recipesPageEntry.fields.categories?.[DEFAULT_LOCALE] || [];
  console.log(`📁 Found ${categoryRefs.length} Categories:\n`);

  for (const categoryRef of categoryRefs) {
    try {
      const category = await environment.getEntry(categoryRef.sys.id);
      const catFields = category.fields;
      
      console.log(`  ID: ${category.sys.id}`);
      console.log(`  Name: ${catFields.name?.[DEFAULT_LOCALE]}`);
      console.log(`  Sort Order: ${catFields.sortOrder?.[DEFAULT_LOCALE]}`);
      console.log('');
    } catch (error) {
      console.error(`  ❌ Failed to fetch category ${categoryRef.sys.id}:`, error.message);
    }
  }

  // Get recipes and check their category links
  const recipeRefs = recipesPageEntry.fields.recipes?.[DEFAULT_LOCALE] || [];
  console.log(`\n🍽️  Found ${recipeRefs.length} Recipes:\n`);

  const categoryIds = new Set(categoryRefs.map(ref => ref.sys.id));

  for (const recipeRef of recipeRefs.slice(0, 10)) { // Show first 10
    try {
      const recipe = await environment.getEntry(recipeRef.sys.id);
      const recipeFields = recipe.fields;
      const categoryId = recipeFields.category?.[DEFAULT_LOCALE]?.sys?.id;
      
      console.log(`  Title: ${recipeFields.title?.[DEFAULT_LOCALE]}`);
      console.log(`  ID: ${recipe.sys.id}`);
      console.log(`  Category ID: ${categoryId || '❌ NO CATEGORY'}`);
      
      if (categoryId) {
        const isCategoryValid = categoryIds.has(categoryId);
        console.log(`  Category Valid: ${isCategoryValid ? '✅' : '❌'}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`  ❌ Failed to fetch recipe ${recipeRef.sys.id}:`, error.message);
    }
  }

  if (recipeRefs.length > 10) {
    console.log(`  ... and ${recipeRefs.length - 10} more recipes\n`);
  }

  console.log('---\n');
  console.log('Summary:');
  console.log(`  Total Categories: ${categoryRefs.length}`);
  console.log(`  Total Recipes: ${recipeRefs.length}`);
}

checkCategories().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
