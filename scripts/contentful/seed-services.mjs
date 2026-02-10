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
  contentType.displayField = "title";
  contentType.fields = fields;
  contentType = await contentType.update();
} catch (error) {
  contentType = await environment.createContentTypeWithId("service", {
    name: "Service",
    displayField: "title",
    fields,
  });
}

if (!contentType.sys.publishedVersion) {
  await contentType.publish();
}

const seedItems = [
  {
    title: "Private Service",
    description: "A personalized dining experience crafted to your taste.",
    benefits: [
      "Custom menus",
      "Fresh, quality ingredients",
      "Stress-free hosting",
      "Beautiful presentation",
      "Private, elevated experience",
    ],
    imagePath: "/services/img-1.png",
    sortOrder: 1,
  },
  {
    title: "Catering",
    description: "Delicious, thoughtfully prepared food for any occasion.",
    benefits: [
      "Event-tailored menus",
      "Fresh, vibrant dishes",
      "Eco-friendly prep",
      "Smooth, reliable service",
      "Ideal for parties & corporate events",
    ],
    imagePath: "/services/img-2.png",
    sortOrder: 2,
  },
  {
    title: "Cooking Class",
    description: "Learn to cook fresh, flavorful meals with confidence.",
    benefits: [
      "Beginner-friendly lessons",
      "Waste-reducing tips",
      "Easy-to-repeat recipes",
      "Fun group experience",
      "Taught by a professional chef",
    ],
    imagePath: "/services/img-3.png",
    sortOrder: 3,
  },
];

const existing = await environment.getEntries({ content_type: "service" });

for (const item of seedItems) {
  const already = existing.items.find(
    (entry) => entry.fields?.title?.[DEFAULT_LOCALE] === item.title
  );

  if (already) {
    continue;
  }

  const entry = await environment.createEntry("service", {
    fields: {
      title: { [DEFAULT_LOCALE]: item.title },
      description: { [DEFAULT_LOCALE]: item.description },
      benefits: { [DEFAULT_LOCALE]: item.benefits },
      imagePath: { [DEFAULT_LOCALE]: item.imagePath },
      sortOrder: { [DEFAULT_LOCALE]: item.sortOrder },
    },
  });

  await entry.publish();
}

console.log("Contentful service content type seeded.");
