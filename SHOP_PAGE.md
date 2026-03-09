# Shop Page Content Structure

The shop page now has its own dedicated content type in Contentful, separate from the recipes page.

## Content Type: `shopPage`

### Fields:
- **bannerTitle** (Text) - Main banner heading
- **bannerDescription** (Text) - Banner description text
- **bannerImage** (Asset) - Main banner background image
- **bannerFeaturedImage1** (Asset) - First featured image (right side, tall)
- **bannerFeaturedImage2** (Asset) - Second featured image (right side, square)
- **categories** (Array of Entry references) - Links to `recipeCategory` entries
- **recipes** (Array of Entry references) - Links to `recipe` entries

## Default Banner Text:
- **Title**: "Premium Recipe Shop"
- **Description**: "Discover our exclusive collection of premium recipes. Add them to your cart and unlock professional cooking secrets."

## How It Works:
1. The shop page fetches all recipes and categories from the `shopPage` content type
2. The client-side component filters to show only paid recipes (where `price` is not "Free")
3. Users can filter by category and search through the premium recipes
4. Featured recipes are highlighted with a "FEATURED" badge

## Setup Instructions:

### 1. Run the seeding script:
```bash
node scripts/contentful/seed-shop-page.mjs
```

This will:
- Create the `shopPage` content type if it doesn't exist
- Reuse existing assets from the recipes page
- Link to existing recipe categories and recipes
- Filter and show only premium recipes (non-free)

### 2. Customize in Contentful:
1. Go to Content → Shop Page
2. Edit the banner title, description, and images
3. Add/remove categories as needed
4. Add/remove premium recipes as needed

### 3. The shop page will:
- Automatically filter to show only paid recipes
- Display them in a grid with pricing
- Show category filters
- Include a search function

## Related Files:
- Content type definition: Created by `scripts/contentful/seed-shop-page.mjs`
- Data fetching: `lib/contentful-management.ts` → `fetchShopPageFromContentful()`
- Server component: `app/shop/page.tsx`
- Client component: `app/shop/shop-page-client.tsx`

## Notes:
- The shop page reuses the same `recipe` and `recipeCategory` content types as the recipes page
- Only recipes with a price (not "Free") are shown in the shop
- Featured recipes show a special badge at the bottom of their card
- The page is cached with ISR (revalidate: 300 seconds)
