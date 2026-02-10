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

const fields = [
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
    type: "Object",
    required: true,
  },
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
    id: "aboutImagePath",
    name: "About Image Path",
    type: "Symbol",
    required: true,
  },
  {
    id: "featuredHeading",
    name: "Featured Heading",
    type: "Symbol",
    required: true,
  },
  {
    id: "featuredRecipes",
    name: "Featured Recipes",
    type: "Object",
    required: true,
  },
  {
    id: "testimonialBackgroundPath",
    name: "Testimonial Background Path",
    type: "Symbol",
    required: true,
  },
  {
    id: "testimonials",
    name: "Testimonials",
    type: "Object",
    required: true,
  },
];

let contentType;
try {
  contentType = await environment.getContentType("homepage");
  contentType.name = "Homepage";
  contentType.displayField = "heroTitle";
  contentType.fields = fields;
  contentType = await contentType.update();
} catch (error) {
  contentType = await environment.createContentTypeWithId("homepage", {
    name: "Homepage",
    displayField: "heroTitle",
    fields,
  });
}

if (!contentType.sys.publishedVersion) {
  await contentType.publish();
}

const existing = await environment.getEntries({ content_type: "homepage" });

if (existing.items.length === 0) {
  const entry = await environment.createEntry("homepage", {
    fields: {
      heroTitle: { [DEFAULT_LOCALE]: "Waste Less. Taste More." },
      heroSubtitle: {
        [DEFAULT_LOCALE]:
          "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
      },
      heroImagePath: { [DEFAULT_LOCALE]: "/hero.png" },
      heroPrimaryCtaLabel: { [DEFAULT_LOCALE]: "Book a Private Experience" },
      heroPrimaryCtaHref: { [DEFAULT_LOCALE]: "/services/private" },
      heroSecondaryCtaLabel: { [DEFAULT_LOCALE]: "View Services" },
      heroSecondaryCtaHref: { [DEFAULT_LOCALE]: "/services" },
      featuresHeading: { [DEFAULT_LOCALE]: "SIMPLE. SUSTAINABLE. DELICIOUS." },
      featuresIntro: {
        [DEFAULT_LOCALE]:
          "We make healthy, eco-conscious eating easy for everyone. Discover recipes and habits that taste as good as they feel.",
      },
      features: {
        [DEFAULT_LOCALE]: [
          {
            title: "RECIPES FOR EVERY MOOD",
            desc: "Find delicious inspiration for every occasion — from quick bites to weekend-worthy meals.",
            imagePath: "/highlight/recipe.png",
          },
          {
            title: "ECO LIVING TIPS",
            desc: "Learn simple, sustainable habits to make your kitchen and home more eco-friendly.",
            imagePath: "/highlight/eco-living.png",
          },
          {
            title: "MEET CHEF AMBER",
            desc: "Discover Chef Amber's story, her cooking philosophy, and the passion behind every flavorful dish.",
            imagePath: "/highlight/meet-chef.png",
          },
        ],
      },
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
      aboutImagePath: { [DEFAULT_LOCALE]: "/highlight/amber-chef.png" },
      featuredHeading: { [DEFAULT_LOCALE]: "Featured Recipes" },
      featuredRecipes: {
        [DEFAULT_LOCALE]: [
          {
            title: "BREAKFAST",
            slug: "breakfast",
            imagePath: "/featured/breakfast.png",
            desc: "Start your day with nourishing, flavor-packed dishes made from fresh, sustainable ingredients.",
          },
          {
            title: "LUNCH",
            slug: "lunch",
            imagePath: "/featured/lunch.png",
            desc: "Light yet satisfying recipes perfect for a mid-day boost wholesome, colorful, and full of life.",
          },
          {
            title: "DINNER",
            slug: "dinner",
            imagePath: "/featured/dinner.png",
            desc: "End your day with hearty, soulful meals crafted to bring comfort, balance, and joy to your table.",
          },
          {
            title: "DESSERT",
            slug: "dessert",
            imagePath: "/featured/dessert.png",
            desc: "Sweet creations that satisfy your cravings while keeping things natural and mindful.",
          },
        ],
      },
      testimonialBackgroundPath: { [DEFAULT_LOCALE]: "/testimonial.png" },
      testimonials: {
        [DEFAULT_LOCALE]: [
          {
            title: "COOKING CLASS",
            text: "\u201c I\u2019m a realtor and I hired Chef Amber to help me bring a unique idea to life. A cooking class attached to a finance class. Sounds crazy but everyone loved it. They appreciated the gems she dropped, her made from scratch sauces and her personality. At one point the room filled with 20+ people was dead silent. Now you know when people are silent and they are eating that means the food is good! I can\u2019t wait to work with her again. \u201d",
            author: "-Lisa Barnes, J. Barnes Realty-",
          },
          {
            title: "PRIVATE DINING",
            text: "\u201c Chef Amber provided an exceptional dining experience for our anniversary. The attention to detail and the fusion of flavors was unlike anything we've had before. Highly recommend! \u201d",
            author: "-Michael & Sarah J.-",
          },
          {
            title: "MEAL PREP",
            text: "\u201c Her meal prep service has changed my life. Eating healthy has never been this easy and delicious. Each dish feels like it was made with so much care and soul. \u201d",
            author: "-David Wilson-",
          },
        ],
      },
    },
  });

  await entry.publish();
}

console.log("Contentful homepage content type seeded.");
