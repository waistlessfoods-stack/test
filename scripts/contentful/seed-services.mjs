import "dotenv/config";
import pkg from 'contentful-management';
const { createClient } = pkg;

const DEFAULT_LOCALE = "en-US";

const accessToken = process.env.CMA_CONTENTFUL;
const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
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
    id: "slug",
    name: "Slug",
    type: "Symbol",
    required: true,
  },
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
    id: "benefits",
    name: "Benefits",
    type: "Array",
    required: true,
    items: { type: "Symbol" },
  },
  {
    id: "imagePath",
    name: "Image Path",
    type: "Symbol",
    required: true,
  },
  {
    id: "breadcrumbLabel",
    name: "Breadcrumb Label",
    type: "Symbol",
    required: true,
  },
  {
    id: "priceText",
    name: "Price Text",
    type: "Symbol",
    required: true,
  },
  {
    id: "includes",
    name: "Includes",
    type: "Array",
    required: true,
    items: { type: "Symbol" },
  },
  {
    id: "howToBook",
    name: "How To Book",
    type: "Array",
    required: true,
    items: { type: "Symbol" },
  },
  {
    id: "mainImagePath",
    name: "Main Image Path",
    type: "Symbol",
    required: true,
  },
  {
    id: "galleryImagePaths",
    name: "Gallery Image Paths",
    type: "Array",
    required: true,
    items: { type: "Symbol" },
  },
  {
    id: "reviews",
    name: "Reviews",
    type: "Object",
    required: true,
  },
  {
    id: "sortOrder",
    name: "Sort Order",
    type: "Integer",
    required: true,
  },
];

let contentType;
try {
  contentType = await environment.getContentType("service");
  contentType.name = "Service";
  const existingFields = contentType.fields ?? [];
  const titleField = existingFields.find(
    (field) => (field.apiName || field.id) === "title"
  );
  contentType.displayField = titleField ? titleField.id : "title";

  const mergedFields = [...existingFields];
  const fieldIndexByApiName = new Map(
    mergedFields.map((field, index) => [field.apiName || field.id, index])
  );

  for (const desired of fields) {
    const existingIndex = fieldIndexByApiName.get(desired.id);

    if (existingIndex !== undefined) {
      const existing = mergedFields[existingIndex];
      mergedFields[existingIndex] = {
        ...existing,
        id: existing.id,
        name: desired.name,
        type: existing.type ?? desired.type,
        required: desired.required,
        items: desired.items ?? existing.items,
        validations: desired.validations ?? existing.validations ?? [],
        disabled: false,
        omitted: false,
      };
      continue;
    }

    mergedFields.push(desired);
  }

  contentType.fields = mergedFields;
  contentType = await contentType.update();
  await contentType.publish();
  contentType = await environment.getContentType("service");
} catch (error) {
  contentType = await environment.createContentTypeWithId("service", {
    name: "Service",
    displayField: "title",
    fields,
  });
  await contentType.publish();
}

const fieldApiNames = new Set(
  (contentType.fields ?? []).map((field) => field.apiName || field.id)
);
const missingFields = fields
  .map((field) => field.id)
  .filter((fieldId) => !fieldApiNames.has(fieldId));

if (missingFields.length > 0) {
  throw new Error(
    `Service content type is missing fields: ${missingFields.join(", ")}. ` +
      "Update the content type in Contentful and re-run the seed script."
  );
}

const sharedReviews = {
  averageRating: 4.8,
  totalReviews: 27,
  items: [
    {
      name: "Sarah J.",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Chef Amber menyulap makan malam kami jadi luar biasa! Presentasi cantik dan rasanya premium.",
    },
    {
      name: "Michael T.",
      rating: 5,
      date: "1 month ago",
      comment:
        "Professional service dari awal sampai akhir. Highly recommended untuk acara spesial.",
    },
    {
      name: "Dina K.",
      rating: 4,
      date: "2 months ago",
      comment:
        "Menu sangat personal dan sesuai request kami. Pengalaman dining yang intimate.",
    },
  ],
};

const seedItems = [
  {
    slug: "private",
    title: "Private Service",
    description:
      "Enjoy a fully personalized dining experience cooked on-site by Chef Amber. Every menu is crafted around your preferences, dietary needs, and the mood of your occasion — using fresh, sustainable, and high-quality ingredients. Perfect for intimate dinners, family meals, or special celebrations at home.",
    benefits: [
      "Custom menus",
      "Fresh, quality ingredients",
      "Stress-free hosting",
      "Beautiful presentation",
      "Private, elevated experience",
    ],
    imagePath: "/services/img-1.png",
    breadcrumbLabel: "Private Service",
    priceText: "Starting at: $XXX per person / $XXX per event",
    includes: [
      "Custom menu consultation",
      "Groceries & ingredient sourcing",
      "On-site cooking & full meal preparation",
      "Professional plating & table presentation",
      "Kitchen cleanup after service",
      "Optional add-ons: dessert course, mocktails, kids' menu",
    ],
    howToBook: [
      "Fill out the booking form or send an inquiry through our contact page.",
      "Share your preferred date, guest count, and any dietary notes.",
      "Receive a customized menu proposal & quote.",
      "Confirm your booking with a deposit.",
      "Relax — Chef Amber handles the rest.",
    ],
    mainImagePath: "/services/private-service/main-img-private.png",
    galleryImagePaths: [
      "/services/private-service/img-1.png",
      "/services/private-service/img-2.png",
      "/services/private-service/img-3.png",
      "/services/private-service/img-4.png",
      "/services/private-service/img-5.png",
    ],
    reviews: sharedReviews,
    sortOrder: 1,
  },
  {
    slug: "catering",
    title: "Catering",
    description:
      "Professional catering for events of all sizes. We provide fresh, flavorful dishes and seamless service for parties, corporate gatherings, and special occasions.",
    benefits: [
      "Event-tailored menus",
      "Fresh, vibrant dishes",
      "Eco-friendly prep",
      "Smooth, reliable service",
      "Ideal for parties & corporate events",
    ],
    imagePath: "/services/img-2.png",
    breadcrumbLabel: "Catering",
    priceText: "Starting at: $XXX per person / $XXX per event",
    includes: [
      "Menu planning consultation",
      "Ingredient sourcing and prep",
      "On-site setup and buffet styling",
      "Serving staff options",
      "Cleanup after service",
      "Custom add-ons for dietary needs",
    ],
    howToBook: [
      "Send your event date, guest count, and location details.",
      "Choose a menu package or request custom options.",
      "Review the proposal and confirm the quote.",
      "Secure the date with a deposit.",
      "Enjoy effortless catering on the day of your event.",
    ],
    mainImagePath: "/services/img-1.png",
    galleryImagePaths: [
      "/services/img-1.png",
      "/services/img-2.png",
      "/services/img-3.png",
    ],
    reviews: sharedReviews,
    sortOrder: 2,
  },
  {
    slug: "cooking-class",
    title: "Cooking Class",
    description:
      "Learn practical cooking skills in a fun and interactive session. Perfect for beginners and food lovers who want to cook confidently at home.",
    benefits: [
      "Beginner-friendly lessons",
      "Waste-reducing tips",
      "Easy-to-repeat recipes",
      "Fun group experience",
      "Taught by a professional chef",
    ],
    imagePath: "/services/img-3.png",
    breadcrumbLabel: "Cooking Class",
    priceText: "Starting at: $XXX per person",
    includes: [
      "Class prep and ingredient kits",
      "Step-by-step live instruction",
      "Hands-on practice and tastings",
      "Recipe cards to take home",
      "Cleanup and kitchen reset",
      "Optional private group sessions",
    ],
    howToBook: [
      "Select your preferred class date and group size.",
      "Share skill level and dietary preferences.",
      "Receive the class outline and pricing.",
      "Confirm the booking with a deposit.",
      "Show up ready to cook and have fun.",
    ],
    mainImagePath: "/services/img-2.png",
    galleryImagePaths: [
      "/services/img-1.png",
      "/services/img-2.png",
      "/services/img-3.png",
    ],
    reviews: sharedReviews,
    sortOrder: 3,
  },
];

const existing = await environment.getEntries({ content_type: "service" });

const toFields = (item) => ({
  slug: { [DEFAULT_LOCALE]: item.slug },
  title: { [DEFAULT_LOCALE]: item.title },
  description: { [DEFAULT_LOCALE]: item.description },
  benefits: { [DEFAULT_LOCALE]: item.benefits },
  imagePath: { [DEFAULT_LOCALE]: item.imagePath },
  breadcrumbLabel: { [DEFAULT_LOCALE]: item.breadcrumbLabel },
  priceText: { [DEFAULT_LOCALE]: item.priceText },
  includes: { [DEFAULT_LOCALE]: item.includes },
  howToBook: { [DEFAULT_LOCALE]: item.howToBook },
  mainImagePath: { [DEFAULT_LOCALE]: item.mainImagePath },
  galleryImagePaths: { [DEFAULT_LOCALE]: item.galleryImagePaths },
  reviews: { [DEFAULT_LOCALE]: item.reviews },
  sortOrder: { [DEFAULT_LOCALE]: item.sortOrder },
});

for (const item of seedItems) {
  const existingEntry = existing.items.find(
    (entry) =>
      entry.fields?.slug?.[DEFAULT_LOCALE] === item.slug ||
      entry.fields?.title?.[DEFAULT_LOCALE] === item.title
  );

  if (existingEntry) {
    existingEntry.fields = toFields(item);
    const updated = await existingEntry.update();
    await updated.publish();
    continue;
  }

  const entry = await environment.createEntry("service", {
    fields: toFields(item),
  });

  await entry.publish();
}

console.log("Contentful service content type seeded.");
