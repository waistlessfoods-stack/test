#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

const DEFAULT_LOCALE = 'en-US';

// Recipe to Category Mapping
const recipeMapping = {
  '5r9nR40QveVb8dU021DqEh': '64pkMVm8Qjex7RF9muDi8N', // Apple Peanut Donut Bites -> BREAKFAST
  '1dAoe4MLXKnjHIxfVku7JO': '2xzxlFABshnRuWOfX5el8E', // Almond Fudge Brownie -> DESSERT
  'WbAe1Q3Z3to7pdkq8zGgM': '41rEuhwI0076eOdPSE40KH', // Creamy Tuna Roll -> FISH & SEAFOOD
  '5tJMp9856oOozUuc3jGVQ1': '2xzxlFABshnRuWOfX5el8E', // Mango Mint Chia Parfait -> DESSERT
  '64qW67XZubyRQy7qrxOJgm': 'sJXG7LAzurPXG1WRBRKku', // Herby Pasta Primavera -> PASTA
  '6KwuJxYGNZVdXaR9TUi6ny': '6DEezgxPzHLr4YVOtqbrKU', // Sweet Potato & Chickpea -> VEGAN
};

async function assignCategoriesWithMigration() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || 'master';

  if (!accessToken || !spaceId) {
    console.error('❌ Missing Contentful credentials');
    process.exit(1);
  }

  console.log('🔄 Attempting category assignment with complete field migration...\n');

  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  let successCount = 0;
  let failureCount = 0;

  for (const [recipeId, categoryId] of Object.entries(recipeMapping)) {
    try {
      const entry = await environment.getEntry(recipeId);
      const currentTitle = entry.fields.title?.[DEFAULT_LOCALE];

      // Make sure category field exists in fields object
      if (!entry.fields.category) {
        entry.fields.category = {};
      }

      // Set the category reference with proper structure
      entry.fields.category[DEFAULT_LOCALE] = {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: categoryId,
        },
      };

      // Update and then save
      const updated = await entry.update();
      console.log(`✅ ${currentTitle}`);
      console.log(`   → Category assigned (ID: ${categoryId})\n`);
      successCount++;
    } catch (error) {
      const entry = await environment.getEntry(recipeId).catch(() => null);
      const title = entry?.fields?.title?.[DEFAULT_LOCALE] || recipeId;
      
      if (error.status === 422 && error.message.includes('No field')) {
        console.log(`⚠️  ${title}`);
        console.log(`   → The category field is not yet active on this entry`);
        console.log(`   → Please manually assign categories in Contentful UI or wait for cache refresh\n`);
      } else {
        console.log(`❌ ${title}`);
        console.log(`   → Error: ${error.message}\n`);
      }
      failureCount++;
    }
  }

  console.log('---\n');
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Failed: ${failureCount}`);
  
  if (failureCount > 0) {
    console.log('\n💡 Workaround: The entries may need cache refresh in Contentful.');
    console.log('   Try these steps:');
    console.log('   1. Go to Settings → Content model');
    console.log('   2. Click Recipe content type');
    console.log('   3. Look for the category field - ensure it\'s not disabled');
    console.log('   4. Try updating one recipe manually in Contentful');
    console.log('   5. Then retry this script');
  }
}

assignCategoriesWithMigration().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
