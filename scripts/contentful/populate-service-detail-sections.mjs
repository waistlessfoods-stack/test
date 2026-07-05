import "dotenv/config";
import pkg from "contentful-management";

const { createClient } = pkg;

const DEFAULT_LOCALE = "en-US";

const accessToken =
  process.env.CMA_CONTENTFUL || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
const environmentId =
  process.env.Contentful_environment ||
  process.env.CONTENTFUL_ENVIRONMENT ||
  "master";

if (!accessToken || !spaceId) {
  throw new Error(
    "Missing Contentful CMA credentials. Set CMA_CONTENTFUL or CONTENTFUL_MANAGEMENT_TOKEN, and Contentful_space_id."
  );
}

const serviceUpdates = {
  private: {
    breadcrumbLabel: "Private Chef",
    detailDescription:
      "WaistLess Foods Signature Private Chef Experience is an immersive, multi-course dining journey prepared entirely on-site and designed to bring fine dining directly into your home. Each experience is built as a cohesive culinary progression, thoughtfully guiding guests through layered flavors, textures, and techniques that unfold with each course. Because everything is prepared from scratch on-site, we provide dietary inclusivity without compromise, ensuring every guest enjoys a thoughtful, beautifully executed plate without ever feeling like an afterthought. Every detail-from preparation to plating-is executed with precision and artistry, creating an elevated dining experience that is both intimate and unforgettable.",
    detailSections: {
      sections: [
        {
          id: "private-chef-experience-includes",
          title: "Your Private Chef Experience Includes",
          variant: "feature-list",
          items: [
            {
              subtitle: "Private In-Home Dining Experience",
              body: "A fully immersive dining experience featuring chef-prepared cuisine and elevated hospitality, designed to deliver an intimate, exclusive fine dining setting within the comfort of your home.",
            },
            {
              subtitle: "Curated Multi-Course Menu",
              body: "Choose from a chef-designed 3, 4, or 5-course menu featuring selections such as an amuse-bouche, intermezzo, appetizer, entree, and dessert. Each experience is paced over approximately 3 hours, allowing every course to be enjoyed at its intended temperature, texture, and presentation.",
            },
            {
              subtitle: "Custom Table Styling & Decor",
              body: "Personalized table decor curated around your selected theme and color palette, with options ranging from romantic and feminine to bold and masculine, or elegant, refined styling.",
            },
            {
              subtitle: "Elevated, Artful Plating",
              body: "Intentional, artful plating designed to create visually striking, beautifully composed dishes that elevate the overall dining experience.",
            },
            {
              subtitle: "Guided Tasting With Chef Insights",
              body: "Each course is introduced with insight into its inspiration, ingredients, and flavor profile, creating a more engaging and immersive dining experience.",
            },
            {
              subtitle: "Hands-On Plating Session",
              body: "Enjoy a hands-on plating moment during a featured course, where guests learn plating techniques and tap into their creativity to beautifully plate a dish.",
            },
          ],
        },
        {
          id: "planning-your-event",
          title: "Planning Your Event",
          variant: "detail-list",
          items: [
            { body: "Ideal for intimate dining for up to 12 guests." },
            { body: "Each menu is custom designed during the planning process." },
            {
              body: "Pricing is customized based on guest count, menu selection, and service style.",
            },
            { body: "Personalized menus are available for every event." },
            { body: "Sample menus are available upon request." },
            {
              body: "Proudly serving Houston and the surrounding areas. Travel is available for select events.",
            },
          ],
        },
      ],
    },
  },
  catering: {
    breadcrumbLabel: "Catering",
    detailDescription:
      "WaistLess Foods catering offers elevated, ready-to-serve cuisine designed to enhance private events, corporate functions, and special celebrations. Each menu is thoughtfully prepared off-site using fresh, seasonal ingredients and curated to reflect your vision, event style, and dietary preferences. From buffet-style service and curated hors d'oeuvres to custom presentations, we create beautifully styled food experiences that align seamlessly with your occasion. Whether you're hosting a business luncheon, team celebration, holiday gathering, or private event, our catering provides seamless execution and attentive service so you can focus on your guests while we handle every culinary detail.",
    includes: [
      "Menu planning consultation",
      "Ingredient sourcing and prep",
      "On-site setup and buffet styling",
      "Serving staff options",
      "Cleanup after service",
      "Custom add-ons for dietary needs",
    ],
    detailSections: {
      sections: [
        {
          id: "catering-experience-includes",
          title: "Your Catering Experience Includes",
          variant: "feature-list",
          items: [
            {
              subtitle: "Menu Planning Consultation",
              body: "Personalized consultation to design a menu tailored to your preferences, dietary needs, and event vision.",
            },
            {
              subtitle: "Fresh Ingredient Sourcing",
              body: "Carefully selected, high-quality ingredients focused on freshness, seasonality, and intentional preparation.",
            },
            {
              subtitle: "Elevated Food Presentation",
              body: "Professionally styled food displays designed to highlight each dish with balance, elegance, and visual appeal.",
            },
            {
              subtitle: "Custom Table Styling",
              body: "Coordinated decor and buffet styling aligned with your event aesthetic for a cohesive guest experience.",
            },
            {
              subtitle: "Flexible Service Styles",
              body: "Versatile service options including buffet presentation, curated hors d'oeuvres, and interactive food stations.",
            },
            {
              subtitle: "Service Equipment & Essentials",
              body: "All necessary serving equipment is provided, with optional tableware and dining essentials available as add-ons upon request.",
            },
            {
              subtitle: "Full-Service Setup & Cleanup",
              body: "Complete on-site setup, breakdown, and cleanup for a seamless, stress-free hosting experience.",
            },
          ],
        },
        {
          id: "planning-your-event",
          title: "Planning Your Event",
          variant: "detail-list",
          items: [
            {
              body: "Ideal for events of up to 120 guests. Please contact us to discuss larger events.",
            },
            {
              body: "Pricing is customized based on guest count, menu selection, and service style.",
            },
            { body: "Personalized menus are available for every event." },
            { body: "Sample menus are available upon request." },
            {
              body: "Proudly serving Houston and the surrounding areas. Travel is available for select events.",
            },
          ],
        },
      ],
    },
  },
  "cooking-classes": {
    breadcrumbLabel: "Cooking Classes",
    detailDescription:
      "Build confidence in the kitchen through a fun, interactive cooking experience designed for every skill level. From mastering professional techniques and thoughtful ingredient preparation to creating beautifully plated dishes, each class equips you with practical skills and chef-inspired knowledge you can recreate long after the experience ends.",
    detailSections: {
      sections: [
        {
          id: "what-youll-experience",
          title: "What You'll Experience",
          variant: "feature-list",
          items: [
            {
              subtitle: "Hands-On Chef-Led Instruction",
              body: "Enjoy a step-by-step, chef-led cooking experience designed to guide you through each stage of preparation with clarity and ease, while participating in interactive instruction that builds essential skills.",
            },
            {
              subtitle: "Artful Plating & Presentation Techniques",
              body: "Master professional plating and presentation techniques that transform everyday dishes into beautifully composed plates using balance, creativity, and thoughtful visual presentation.",
            },
            {
              subtitle: "Waste-Reducing Kitchen Tips",
              body: "Discover practical techniques to reduce food waste, maximize the use of every ingredient, and transform everyday kitchen scraps into flavorful additions that elevate your cooking.",
            },
            {
              subtitle: "Take-Home Recipe Collection",
              body: "Receive recipe cards from your session to continue practicing and recreating elevated dishes in your own kitchen.",
            },
            {
              subtitle: "Curated Beverage Pairing",
              body: "Sip and savor thoughtfully selected beverages, including wine for adult classes or non-alcoholic refreshments, curated to complement the featured menu.",
            },
          ],
        },
        {
          id: "find-your-perfect-class",
          title: "Find Your Perfect Class",
          variant: "detail-list",
          items: [
            { body: "Multi-Course Culinary Experience" },
            { body: "Plant-Based & Dairy-Free Cuisine" },
            { body: "Seasonal Salads & Homemade Dressings" },
            { body: "The Art of Sauce Making" },
            { body: "Artful Plating & Presentation" },
            { body: "Guests must be ages 6 and older." },
            {
              body: "Classes typically last 3-5 hours, depending on the selected class and the complexity of the menu.",
            },
            {
              body: "No BYOB. Complimentary beverages are provided for adult classes only.",
            },
          ],
        },
      ],
    },
  },
};

function setLocalizedField(entry, fieldId, value) {
  entry.fields[fieldId] = {
    ...(entry.fields[fieldId] || {}),
    [DEFAULT_LOCALE]: value,
  };
}

const client = createClient({ accessToken });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

for (const [slug, update] of Object.entries(serviceUpdates)) {
  const entries = await environment.getEntries({
    content_type: "service",
    "fields.slug": slug,
    limit: 1,
  });
  const entry = entries.items[0];

  if (!entry) {
    throw new Error(`Could not find service entry with slug '${slug}'.`);
  }

  setLocalizedField(entry, "detailDescription", update.detailDescription);
  setLocalizedField(entry, "detailSections", update.detailSections);
  setLocalizedField(entry, "breadcrumbLabel", update.breadcrumbLabel);
  if (update.includes) {
    setLocalizedField(entry, "includes", update.includes);
  }

  const updated = await entry.update();
  await updated.publish();

  console.log(`Populated detailSections for service '${slug}'.`);
}

console.log(
  `Service detailSections content populated in Contentful environment '${environmentId}'.`
);
