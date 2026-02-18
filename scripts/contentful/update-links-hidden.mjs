import pkg from "contentful-management";
import dotenv from "dotenv";

const { createClient } = pkg;

dotenv.config();

const DEFAULT_LOCALE = "en-US";

async function updateLinksWithHiddenField() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId = process.env.Contentful_space_id;
  const environmentId = process.env.Contentful_environment || "master";

  if (!accessToken || !spaceId) {
    console.error("❌ Missing Contentful credentials");
    return;
  }

  console.log("🔄 Connecting to Contentful...");
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  // Step 1: Update the content type to add 'hidden' field if it doesn't exist
  console.log("🔄 Checking content type for 'hidden' field...");
  const contentType = await environment.getContentType("linksPageLink");
  
  const hasHiddenField = contentType.fields.some(field => field.id === "hidden");
  
  if (!hasHiddenField) {
    console.log("➕ Adding 'hidden' field to linksPageLink content type...");
    contentType.fields.push({
      id: "hidden",
      name: "Hidden",
      type: "Boolean",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    });
    
    const updatedContentType = await contentType.update();
    console.log("✅ Content type updated");
    
    // Publish the content type
    await updatedContentType.publish();
    console.log("✅ Content type published");
    
    // Wait a bit for propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log("✅ 'hidden' field already exists");
  }

  // Step 2: Fetch all link entries
  console.log("🔄 Fetching link entries...");
  const entries = await environment.getEntries({
    content_type: "linksPageLink",
  });

  // Step 3: Find and update the specific entries
  const entriesToHide = [
    "Membership / VIP List",
    "Recipes & Blog",
    "Recipes & Blog tes", // Handle the test variant too
  ];

  for (const entry of entries.items) {
    const title = entry.fields.title?.[DEFAULT_LOCALE];
    
    if (typeof title === "string" && entriesToHide.some(hideTitle => title.includes(hideTitle.split(' ')[0]))) {
      console.log(`🔄 Updating "${title}" to hidden...`);
      
      // Set hidden to true
      entry.fields.hidden = {
        [DEFAULT_LOCALE]: true,
      };
      
      // Update the entry
      const updatedEntry = await entry.update();
      console.log(`✅ Updated "${title}"`);
      
      // Publish the entry
      await updatedEntry.publish();
      console.log(`✅ Published "${title}"`);
    }
  }

  console.log("✅ All done! The Membership/VIP and Recipes/Blog sections are now hidden in Contentful");
}

updateLinksWithHiddenField().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
