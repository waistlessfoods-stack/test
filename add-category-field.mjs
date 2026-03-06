#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

const DEFAULT_LOCALE = 'en-US';

async function addCategoryFieldToRecipeContentType() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || 'master';

  if (!accessToken || !spaceId) {
    console.error('❌ Missing Contentful credentials');
    process.exit(1);
  }

  console.log('🔧 Adding category field to Recipe content type...\n');

  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  try {
    // Get the Recipe content type
    const contentType = await environment.getContentType('recipe');
    
    // Check if category field already exists
    const categoryFieldExists = contentType.fields.some(field => field.id === 'category');
    
    if (categoryFieldExists) {
      console.log('✅ Category field already exists on Recipe content type\n');
    } else {
      // Add the category field
      contentType.fields.push({
        id: 'category',
        name: 'Category',
        type: 'Link',
        linkType: 'Entry',
        validations: [
          {
            linkContentType: ['recipeCategory']
          }
        ]
      });

      // Save the updated content type
      const updatedContentType = await contentType.update();
      
      // Publish the updated content type
      await updatedContentType.publish();
      
      console.log('✅ Category field added to Recipe content type\n');
    }

    console.log('✅ Content type updated successfully!\n');
  } catch (error) {
    console.error('❌ Failed to update content type:', error.message);
    console.error('Details:', error.details || error);
    process.exit(1);
  }
}

addCategoryFieldToRecipeContentType().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
