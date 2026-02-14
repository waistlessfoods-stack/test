import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;
const DEFAULT_LOCALE = "en-US";

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId =
  process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL and Contentful_space_id."
  );
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

// =============================================================================
// 1. Create LinksPageLink content type (individual link items)
// =============================================================================

const linkFields = [
  {
    id: "title",
    name: "Title",
    type: "Symbol",
    required: true,
  },
  {
    id: "description",
    name: "Description",
    type: "Symbol",
    required: true,
  },
  {
    id: "href",
    name: "Href",
    type: "Symbol",
    required: true,
  },
  {
    id: "highlight",
    name: "Highlight",
    type: "Boolean",
    required: true,
  },
  {
    id: "icon",
    name: "Icon",
    type: "Symbol",
    required: true,
  },
  {
    id: "sortOrder",
    name: "Sort Order",
    type: "Integer",
    required: true,
  },
];

let linkContentType;
try {
  linkContentType = await environment.getContentType("linksPageLink");
  linkContentType.name = "Links Page Link";
  linkContentType.displayField = "title";
  linkContentType.fields = linkFields;
  linkContentType = await linkContentType.update();
  if (!linkContentType.sys.publishedVersion) {
    await linkContentType.publish();
  }
} catch (error) {
  linkContentType = await environment.createContentTypeWithId(
    "linksPageLink",
    {
      name: "Links Page Link",
      displayField: "title",
      fields: linkFields,
    }
  );
  await linkContentType.publish();
}

// =============================================================================
// 2. Seed individual link entries
// =============================================================================

const primaryLinkData = [
  {
    title: "Book Private Chef",
    description: "In-home dining experiences tailored to your event.",
    href: "/services/private",
    highlight: true,
    icon: "ChefHat",
    sortOrder: 1,
  },
  {
    title: "Catering Inquiry",
    description: "Menus for corporate, weddings, and special occasions.",
    href: "mailto:info@waistlessfoods.com?subject=Catering%20Inquiry",
    highlight: false,
    icon: "Utensils",
    sortOrder: 2,
  },
  {
    title: "Cooking Classes",
    description: "Interactive classes for teams, groups, and celebrations.",
    href: "/services/cooking-class",
    highlight: false,
    icon: "Users",
    sortOrder: 3,
  },
  {
    title: "Membership / VIP List",
    description: "Priority access to menus, events, and private drops.",
    href: "mailto:info@waistlessfoods.com?subject=VIP%20List",
    highlight: false,
    icon: "Crown",
    sortOrder: 4,
  },
  {
    title: "Recipes & Blog",
    description: "Explore seasonal recipes and kitchen tips.",
    href: "/recipes",
    highlight: false,
    icon: "BookOpen",
    sortOrder: 5,
  },
];

const existingLinks = await environment.getEntries({
  content_type: "linksPageLink",
});
const linkEntryIds = [];

for (const linkData of primaryLinkData) {
  const existingLink = existingLinks.items.find(
    (entry) => entry.fields?.title?.[DEFAULT_LOCALE] === linkData.title
  );

  if (existingLink) {
    existingLink.fields = {
      title: { [DEFAULT_LOCALE]: linkData.title },
      description: { [DEFAULT_LOCALE]: linkData.description },
      href: { [DEFAULT_LOCALE]: linkData.href },
      highlight: { [DEFAULT_LOCALE]: linkData.highlight },
      icon: { [DEFAULT_LOCALE]: linkData.icon },
      sortOrder: { [DEFAULT_LOCALE]: linkData.sortOrder },
    };
    const updated = await existingLink.update();
    await updated.publish();
    linkEntryIds.push(existingLink.sys.id);
  } else {
    const linkEntry = await environment.createEntry("linksPageLink", {
      fields: {
        title: { [DEFAULT_LOCALE]: linkData.title },
        description: { [DEFAULT_LOCALE]: linkData.description },
        href: { [DEFAULT_LOCALE]: linkData.href },
        highlight: { [DEFAULT_LOCALE]: linkData.highlight },
        icon: { [DEFAULT_LOCALE]: linkData.icon },
        sortOrder: { [DEFAULT_LOCALE]: linkData.sortOrder },
      },
    });
    await linkEntry.publish();
    linkEntryIds.push(linkEntry.sys.id);
  }
}

// =============================================================================
// 3. Create LinksPage content type with references to LinksPageLink
// =============================================================================

const pageFields = [
  {
    id: "profileName",
    name: "Profile Name",
    type: "Symbol",
    required: true,
  },
  {
    id: "profileTagline",
    name: "Profile Tagline",
    type: "Symbol",
    required: true,
  },
  {
    id: "profileDescription",
    name: "Profile Description",
    type: "Text",
    required: true,
  },
  {
    id: "profilePhone",
    name: "Profile Phone",
    type: "Symbol",
    required: true,
  },
  {
    id: "profileEmail",
    name: "Profile Email",
    type: "Symbol",
    required: true,
  },
  {
    id: "profileImagePath",
    name: "Profile Image Path",
    type: "Symbol",
    required: true,
  },
  {
    id: "conferenceHeading",
    name: "Conference Heading",
    type: "Symbol",
    required: true,
  },
  {
    id: "conferenceSubheading",
    name: "Conference Subheading",
    type: "Symbol",
    required: true,
  },
  {
    id: "primaryLinksReferences",
    name: "Primary Links References",
    type: "Array",
    required: true,
    items: {
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["linksPageLink"],
        },
      ],
    },
  },
  {
    id: "socialLinks",
    name: "Social Links",
    type: "Object",
    required: true,
  },
  {
    id: "footerText",
    name: "Footer Text",
    type: "Symbol",
    required: true,
  },
];

let contentType;
try {
  contentType = await environment.getContentType("linksPage");
  contentType.name = "Links Page";
  contentType.displayField = "profileName";

  // Merge existing fields with new ones
  const existingFields = contentType.fields ?? [];
  const newFieldMap = new Map(pageFields.map((f) => [f.id, f]));
  const fieldsToKeep = [];

  for (const existing of existingFields) {
    const apiName = existing.apiName || existing.id;

    if (apiName === "primaryLinks") {
      // Mark old field as omitted instead of removing, and make it non-required for backwards compatibility
      fieldsToKeep.push({
        ...existing,
        omitted: true,
        required: false,
      });
      continue;
    }

    const newField = newFieldMap.get(apiName);
    if (newField) {
      fieldsToKeep.push({
        ...existing,
        ...newField,
        id: existing.id,
      });
      newFieldMap.delete(apiName);
    } else {
      fieldsToKeep.push(existing);
    }
  }

  // Add any new fields that weren't in the existing content type
  for (const newField of newFieldMap.values()) {
    fieldsToKeep.push(newField);
  }

  contentType.fields = fieldsToKeep;
  contentType = await contentType.update();
  contentType = await contentType.publish();
} catch (error) {
  contentType = await environment.createContentTypeWithId("linksPage", {
    name: "Links Page",
    displayField: "profileName",
    fields: pageFields,
  });
  await contentType.publish();
}

// =============================================================================
// 4. Seed LinksPage entry with references
// =============================================================================

const existing = await environment.getEntries({ content_type: "linksPage" });

const linksPageData = {
  profileName: "WaistLess Foods",
  profileTagline: "Luxury In-Home Dining & Private Events",
  profileDescription:
    "WaistLess Foods delivers the ultimate private chef and catering service, transforming every ingredient into intentional, indulgent cuisine. Experience a menu curated to your needs, bringing captivating flavors and artful presentation to your next special occasion.",
  profilePhone: "281-436-9245",
  profileEmail: "info@waistlessfoods.com",
  profileImagePath: "/amber.jpg",
  conferenceHeading: "Visiting from Culinary Conference?",
  conferenceSubheading:
    "Join the VIP list for exclusive menus and private event booking priority.",
  socialLinks: [
    {
      title: "Instagram",
      href: "https://www.instagram.com/waistlessfoods/?hl=en",
      icon: "Instagram",
    },
    {
      title: "Facebook",
      href: "https://www.facebook.com/WaistLessFoods/",
      icon: "Facebook",
    },
    {
      title: "TikTok",
      href: "https://www.tiktok.com/@waistlessfoods",
      icon: "Music",
    },
    {
      title: "Google Business",
      href: "https://share.google/ALuik169vluev16od",
      icon: "MapPin",
    },
    {
      title: "Yelp",
      href: "https://www.yelp.com/biz/waistless-foods-houston-2",
      icon: "Star",
    },
  ],
  footerText: "waistlessfoods.com/links",
};

if (existing.items.length === 0) {
  const entry = await environment.createEntry("linksPage", {
    fields: {
      profileName: { [DEFAULT_LOCALE]: linksPageData.profileName },
      profileTagline: { [DEFAULT_LOCALE]: linksPageData.profileTagline },
      profileDescription: { [DEFAULT_LOCALE]: linksPageData.profileDescription },
      profilePhone: { [DEFAULT_LOCALE]: linksPageData.profilePhone },
      profileEmail: { [DEFAULT_LOCALE]: linksPageData.profileEmail },
      profileImagePath: { [DEFAULT_LOCALE]: linksPageData.profileImagePath },
      conferenceHeading: { [DEFAULT_LOCALE]: linksPageData.conferenceHeading },
      conferenceSubheading: {
        [DEFAULT_LOCALE]: linksPageData.conferenceSubheading,
      },
      primaryLinksReferences: {
        [DEFAULT_LOCALE]: linkEntryIds.map((id) => ({
          sys: { type: "Link", linkType: "Entry", id },
        })),
      },
      socialLinks: { [DEFAULT_LOCALE]: linksPageData.socialLinks },
      footerText: { [DEFAULT_LOCALE]: linksPageData.footerText },
    },
  });

  await entry.publish();
} else {
  // Fetch a fresh copy of the entry
  const entryId = existing.items[0].sys.id;
  let entry = await environment.getEntry(entryId);
  
  // Unpublish the entry if it's published
  if (entry.sys.publishedVersion) {
    entry = await entry.unpublish();
  }
  
  // Update with new fields
  entry.fields = {
    profileName: { [DEFAULT_LOCALE]: linksPageData.profileName },
    profileTagline: { [DEFAULT_LOCALE]: linksPageData.profileTagline },
    profileDescription: { [DEFAULT_LOCALE]: linksPageData.profileDescription },
    profilePhone: { [DEFAULT_LOCALE]: linksPageData.profilePhone },
    profileEmail: { [DEFAULT_LOCALE]: linksPageData.profileEmail },
    profileImagePath: { [DEFAULT_LOCALE]: linksPageData.profileImagePath },
    conferenceHeading: { [DEFAULT_LOCALE]: linksPageData.conferenceHeading },
    conferenceSubheading: {
      [DEFAULT_LOCALE]: linksPageData.conferenceSubheading,
    },
    primaryLinksReferences: {
      [DEFAULT_LOCALE]: linkEntryIds.map((id) => ({
        sys: { type: "Link", linkType: "Entry", id },
      })),
    },
    socialLinks: { [DEFAULT_LOCALE]: linksPageData.socialLinks },
    footerText: { [DEFAULT_LOCALE]: linksPageData.footerText },
  };
  
  const updated = await entry.update();
  await updated.publish();
}

console.log("Contentful links page content types and entries seeded.");
