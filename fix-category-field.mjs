#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

async function fixCategoryField() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || 'master';

  if (!accessToken || !spaceId) {
    console.error('❌ Missing Contentful credentials');
    process.exit(1);
  }

  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  console.log('🔧 Checking Recipe content type...\n');

  // Get content type (unpublished version)
  const contentType = await environment.getContentType('recipe');
  
  console.log('📋 Content Type Info:');
  console.log(`  - Version: ${contentType.sys.version}`);
  console.log(`  - Field count: ${contentType.fields.length}`);
  console.log('');

  // Check if category field exists
  const categoryField = contentType.fields.find(f => f.id === 'category');
  if (categoryField) {
    console.log('✅ Category field exists:');
    console.log(`  - ID: ${categoryField.id}`);
    console.log(`  - Name: ${categoryField.name}`);
    console.log(`  - Type: ${categoryField.type}`);
    console.log(`  - LinkType: ${categoryField.linkType}`);
    console.log('');
  } else {
    console.log('❌ Category field NOT found\n');
    process.exit(1);
  }

  try {
    // Try to publish the content type if not already published
    const isPublished = contentType.isPublished?.();
    console.log(`\n📡 Publishing status check: ${isPublished ? 'Published' : 'Not published'}`);
    
    if (!isPublished) {
      console.log('Publishing content type...');
      await contentType.publish();
      console.log('✅ Content type published\n');
    }

    // Now try to assign a category to test
    console.log('🧪 Testing category assignment...\n');
    
    const testEntry = await environment.getEntry('5r9nR40QveVb8dU021DqEh');
    testEntry.fields.category = {
      'en-US': {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: '64pkMVm8Qjex7RF9muDi8N', // BREAKFAST
        },
      },
    };

    const updated = await testEntry.update();
    console.log('✅ Test successful! Category field is now working');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

fixCategoryField().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
