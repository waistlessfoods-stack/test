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

// Helper function to create or update content type
async function createOrUpdateContentType(id, definition) {
  let contentType;
  try {
    contentType = await environment.getContentType(id);
    contentType.name = definition.name;
    contentType.displayField = definition.displayField;
    contentType.fields = definition.fields;
    contentType = await contentType.update();
    console.log(`Updated content type: ${id}`);
  } catch (error) {
    contentType = await environment.createContentTypeWithId(id, definition);
    console.log(`Created content type: ${id}`);
  }

  if (!contentType.sys.publishedVersion) {
    await contentType.publish();
  }

  return contentType;
}

// 1. Create Feature Item Content Type
await createOrUpdateContentType("featureItem", {
  name: "Feature Item",
  displayField: "title",
  fields: [
    {
      id: "title",
      name: "Title",
      type: "Symbol",
      required: true,
    },
    {
      id: "description",
      name: "Description",
      type: "Text",
      required: true,
    },
    {
      id: "imagePath",
      name: "Image Path",
      type: "Symbol",
      required: true,
    },
    {
      id: "buttonLabel",
      name: "Button Label",
      type: "Symbol",
      required: false,
    },
    {
      id: "buttonHref",
      name: "Button Href",
      type: "Symbol",
      required: false,
    },
    {
      id: "sortOrder",
      name: "Sort Order",
      type: "Integer",
      required: true,
    },
  ],
});

// 2. Create Featured Recipe Content Type
await createOrUpdateContentType("featuredRecipe", {
  name: "Featured Recipe",
  displayField: "title",
  fields: [
    {
      id: "title",
      name: "Title",
      type: "Symbol",
      required: true,
    },
    {
      id: "slug",
      name: "Slug",
      type: "Symbol",
      required: true,
    },
    {
      id: "description",
      name: "Description",
      type: "Text",
      required: true,
    },
    {
      id: "imagePath",
      name: "Image Path",
      type: "Symbol",
      required: true,
    },
    {
      id: "sortOrder",
      name: "Sort Order",
      type: "Integer",
      required: true,
    },
  ],
});

// 3. Create Testimonial Content Type
await createOrUpdateContentType("testimonial", {
  name: "Testimonial",
  displayField: "title",
  fields: [
    {
      id: "title",
      name: "Title",
      type: "Symbol",
      required: true,
    },
    {
      id: "text",
      name: "Text",
      type: "Text",
      required: true,
    },
    {
      id: "author",
      name: "Author",
      type: "Symbol",
      required: true,
    },
    {
      id: "sortOrder",
      name: "Sort Order",
      type: "Integer",
      required: true,
    },
  ],
});

// 4. Create Homepage Content Type with References
await createOrUpdateContentType("homepage", {
  name: "Homepage",
  displayField: "heroTitle",
  fields: [
    // Hero Section
    {
      id: "heroTitle",
      name: "Hero Title",
      type: "Symbol",
      required: true,
    },
    {
      id: "heroSubtitle",
      name: "Hero Subtitle",
      type: "Text",
      required: true,
    },
    {
      id: "heroImagePath",
      name: "Hero Image Path",
      type: "Symbol",
      required: true,
    },
    {
      id: "heroPrimaryCtaLabel",
      name: "Hero Primary CTA Label",
      type: "Symbol",
      required: true,
    },
    {
      id: "heroPrimaryCtaHref",
      name: "Hero Primary CTA Href",
      type: "Symbol",
      required: true,
    },
    {
      id: "heroSecondaryCtaLabel",
      name: "Hero Secondary CTA Label",
      type: "Symbol",
      required: true,
    },
    {
      id: "heroSecondaryCtaHref",
      name: "Hero Secondary CTA Href",
      type: "Symbol",
      required: true,
    },
    // Features Section
    {
      id: "featuresHeading",
      name: "Features Heading",
      type: "Symbol",
      required: true,
    },
    {
      id: "featuresIntro",
      name: "Features Intro",
      type: "Text",
      required: true,
    },
    {
      id: "features",
      name: "Features",
      type: "Array",
      required: true,
      items: {
        type: "Link",
        linkType: "Entry",
        validations: [
          {
            linkContentType: ["featureItem"],
          },
        ],
      },
    },
    // About Section
    {
      id: "aboutHeading",
      name: "About Heading",
      type: "Symbol",
      required: true,
    },
    {
      id: "aboutBodyPrimary",
      name: "About Body Primary",
      type: "Text",
      required: true,
    },
    {
      id: "aboutBodySecondary",
      name: "About Body Secondary",
      type: "Text",
      required: true,
    },
    {
      id: "aboutBodyTertiary",
      name: "About Body Tertiary",
      type: "Text",
      required: true,
    },
    {
      id: "aboutBullets",
      name: "About Bullets",
      type: "Array",
      required: true,
      items: { type: "Symbol" },
    },
    {
      id: "aboutButtonLabel",
      name: "About Button Label",
      type: "Symbol",
      required: true,
    },
    {
      id: "aboutButtonHref",
      name: "About Button Href",
      type: "Symbol",
      required: false,
    },
    {
      id: "aboutImagePath",
      name: "About Image Path",
      type: "Symbol",
      required: true,
    },
    // Featured Recipes Section
    {
      id: "featuredHeading",
      name: "Featured Heading",
      type: "Symbol",
      required: true,
    },
    {
      id: "featuredRecipes",
      name: "Featured Recipes",
      type: "Array",
      required: true,
      items: {
        type: "Link",
        linkType: "Entry",
        validations: [
          {
            linkContentType: ["featuredRecipe"],
          },
        ],
      },
    },
    // Testimonials Section
    {
      id: "testimonialBackgroundPath",
      name: "Testimonial Background Path",
      type: "Symbol",
      required: true,
    },
    {
      id: "testimonials",
      name: "Testimonials",
      type: "Array",
      required: true,
      items: {
        type: "Link",
        linkType: "Entry",
        validations: [
          {
            linkContentType: ["testimonial"],
          },
        ],
      },
    },
  ],
});

// Create Feature Items
const featureItemsData = [
  {
    id: "feature-recipes",
    title: "RECIPES FOR EVERY MOOD",
    description:
      "Find delicious inspiration for every occasion — from quick bites to weekend-worthy meals.",
    imagePath: "/highlight/recipe.png",
    buttonLabel: "More Info",
    sortOrder: 1,
  },
  {
    id: "feature-eco-living",
    title: "ECO LIVING TIPS",
    description:
      "Learn simple, sustainable habits to make your kitchen and home more eco-friendly.",
    imagePath: "/highlight/eco-living.png",
    buttonLabel: "More Info",
    sortOrder: 2,
  },
  {
    id: "feature-meet-chef",
    title: "MEET CHEF AMBER",
    description:
      "Discover Chef Amber's story, her cooking philosophy, and the passion behind every flavorful dish.",
    imagePath: "/highlight/meet-chef.png",
    buttonLabel: "More Info",
    sortOrder: 3,
  },
];

const featureItemRefs = [];
for (const data of featureItemsData) {
  const entries = await environment.getEntries({
    content_type: "featureItem",
    "fields.title": data.title,
  });

  let entry;
  if (entries.items.length > 0) {
    entry = entries.items[0];
    console.log(`Feature item already exists: ${data.title}`);
  } else {
    entry = await environment.createEntry("featureItem", {
      fields: {
        title: { [DEFAULT_LOCALE]: data.title },
        description: { [DEFAULT_LOCALE]: data.description },
        imagePath: { [DEFAULT_LOCALE]: data.imagePath },
        buttonLabel: { [DEFAULT_LOCALE]: data.buttonLabel },
        sortOrder: { [DEFAULT_LOCALE]: data.sortOrder },
      },
    });
    await entry.publish();
    console.log(`Created feature item: ${data.title}`);
  }
  featureItemRefs.push({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: entry.sys.id,
    },
  });
}

// Create Featured Recipes
const featuredRecipesData = [
  {
    title: "BREAKFAST",
    slug: "breakfast",
    description:
      "Start your day with nourishing, flavor-packed dishes made from fresh, sustainable ingredients.",
    imagePath: "/featured/breakfast.png",
    sortOrder: 1,
  },
  {
    title: "LUNCH",
    slug: "lunch",
    description:
      "Light yet satisfying recipes perfect for a mid-day boost wholesome, colorful, and full of life.",
    imagePath: "/featured/lunch.png",
    sortOrder: 2,
  },
  {
    title: "DINNER",
    slug: "dinner",
    description:
      "End your day with hearty, soulful meals crafted to bring comfort, balance, and joy to your table.",
    imagePath: "/featured/dinner.png",
    sortOrder: 3,
  },
  {
    title: "DESSERT",
    slug: "dessert",
    description:
      "Sweet creations that satisfy your cravings while keeping things natural and mindful.",
    imagePath: "/featured/dessert.png",
    sortOrder: 4,
  },
];

const featuredRecipeRefs = [];
for (const data of featuredRecipesData) {
  const entries = await environment.getEntries({
    content_type: "featuredRecipe",
    "fields.slug": data.slug,
  });

  let entry;
  if (entries.items.length > 0) {
    entry = entries.items[0];
    console.log(`Featured recipe already exists: ${data.title}`);
  } else {
    entry = await environment.createEntry("featuredRecipe", {
      fields: {
        title: { [DEFAULT_LOCALE]: data.title },
        slug: { [DEFAULT_LOCALE]: data.slug },
        description: { [DEFAULT_LOCALE]: data.description },
        imagePath: { [DEFAULT_LOCALE]: data.imagePath },
        sortOrder: { [DEFAULT_LOCALE]: data.sortOrder },
      },
    });
    await entry.publish();
    console.log(`Created featured recipe: ${data.title}`);
  }
  featuredRecipeRefs.push({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: entry.sys.id,
    },
  });
}

// Create Testimonials
const testimonialsData = [
  {
    title: "COOKING CLASS",
    text: "\"I'm a realtor and I hired Chef Amber to help me bring a unique idea to life. A cooking class attached to a finance class. Sounds crazy but everyone loved it. They appreciated the gems she dropped, her made from scratch sauces and her personality. At one point the room filled with 20+ people was dead silent. Now you know when people are silent and they are eating that means the food is good! I can't wait to work with her again.\"",
    author: "-Lisa Barnes, J. Barnes Realty-",
    sortOrder: 1,
  },
  {
    title: "PRIVATE DINING",
    text: "\"Chef Amber provided an exceptional dining experience for our anniversary. The attention to detail and the fusion of flavors was unlike anything we've had before. Highly recommend!\"",
    author: "-Michael & Sarah J.-",
    sortOrder: 2,
  },
  {
    title: "MEAL PREP",
    text: "\"Her meal prep service has changed my life. Eating healthy has never been this easy and delicious. Each dish feels like it was made with so much care and soul.\"",
    author: "-David Wilson-",
    sortOrder: 3,
  },
];

const testimonialRefs = [];
for (const data of testimonialsData) {
  const entries = await environment.getEntries({
    content_type: "testimonial",
    "fields.title": data.title,
  });

  let entry;
  if (entries.items.length > 0) {
    entry = entries.items[0];
    console.log(`Testimonial already exists: ${data.title}`);
  } else {
    entry = await environment.createEntry("testimonial", {
      fields: {
        title: { [DEFAULT_LOCALE]: data.title },
        text: { [DEFAULT_LOCALE]: data.text },
        author: { [DEFAULT_LOCALE]: data.author },
        sortOrder: { [DEFAULT_LOCALE]: data.sortOrder },
      },
    });
    await entry.publish();
    console.log(`Created testimonial: ${data.title}`);
  }
  testimonialRefs.push({
    sys: {
      type: "Link",
      linkType: "Entry",
      id: entry.sys.id,
    },
  });
}

// Create or Update Homepage Entry
const existing = await environment.getEntries({ content_type: "homepage" });

if (existing.items.length === 0) {
  const entry = await environment.createEntry("homepage", {
    fields: {
      heroTitle: { [DEFAULT_LOCALE]: "Waste Less.\nTaste More." },
      heroSubtitle: {
        [DEFAULT_LOCALE]:
          "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
      },
      heroImagePath: { [DEFAULT_LOCALE]: "/hero.png" },
      heroPrimaryCtaLabel: { [DEFAULT_LOCALE]: "Book a Private Experience" },
      heroPrimaryCtaHref: { [DEFAULT_LOCALE]: "/services" },
      heroSecondaryCtaLabel: { [DEFAULT_LOCALE]: "View Services" },
      heroSecondaryCtaHref: { [DEFAULT_LOCALE]: "/services" },
      featuresHeading: { [DEFAULT_LOCALE]: "SIMPLE. SUSTAINABLE. DELICIOUS." },
      featuresIntro: {
        [DEFAULT_LOCALE]:
          "We make healthy, eco-conscious eating easy for everyone. Discover recipes and habits that taste as good as they feel.",
      },
      features: { [DEFAULT_LOCALE]: featureItemRefs },
      aboutHeading: { [DEFAULT_LOCALE]: "ABOUT CHEF AMBER" },
      aboutBodyPrimary: {
        [DEFAULT_LOCALE]:
          "Chef Amber is the creative force behind WaistLess Foods, blending flavor, sustainability, and heart into every dish she makes.",
      },
      aboutBodySecondary: {
        [DEFAULT_LOCALE]:
          "As a Houston-based private chef, Amber transforms everyday ingredients into soulful, nourishing meals designed to make healthy eating effortless and enjoyable.",
      },
      aboutBodyTertiary: {
        [DEFAULT_LOCALE]:
          "Her journey began cooking for her family of four — now it's her mission to show that mindful cooking can be both exciting and full of love.",
      },
      aboutBullets: {
        [DEFAULT_LOCALE]: [
          "Sustainable Cooking",
          "Flavor-Driven Recipes",
          "Family-Inspired Meals",
          "Always Made with Care",
        ],
      },
      aboutButtonLabel: { [DEFAULT_LOCALE]: "Meet Chef Amber" },
      aboutButtonHref: { [DEFAULT_LOCALE]: "/about" },
      aboutImagePath: { [DEFAULT_LOCALE]: "/highlight/amber-chef.png" },
      featuredHeading: { [DEFAULT_LOCALE]: "Featured Recipes" },
      featuredRecipes: { [DEFAULT_LOCALE]: featuredRecipeRefs },
      testimonialBackgroundPath: { [DEFAULT_LOCALE]: "/testimonial.png" },
      testimonials: { [DEFAULT_LOCALE]: testimonialRefs },
    },
  });

  await entry.publish();
  console.log("Created homepage entry");
} else {
  console.log("Homepage entry already exists");
}

console.log("\n✅ Contentful homepage setup complete with references!");
