#!/usr/bin/env node

import pkg from 'contentful-management';
import dotenv from 'dotenv';

const { createClient } = pkg;

// Load environment variables
dotenv.config();

async function inspectRecipeFields() {
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

  // Get the Recipe content type
  const contentType = await environment.getContentType('recipe');
  
  console.log('📋 Recipe Content Type Fields:\n');
  contentType.fields.forEach(field => {
    console.log(`  ${field.id}:`);
    console.log(`    - name: ${field.name}`);
    console.log(`    - type: ${field.type}`);
    if (field.linkType) console.log(`    - linkType: ${field.linkType}`);
    console.log('');
  });

  // Check a sample entry
  const entry = await environment.getEntry('5r9nR40QveVb8dU021DqEh');
  console.log('📝 Sample Entry (Apple Peanut Donut Bites) Fields:\n');
  Object.keys(entry.fields).forEach(key => {
    console.log(`  ${key}: ${JSON.stringify(entry.fields[key], null, 2)}`);
  });
}

inspectRecipeFields().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
