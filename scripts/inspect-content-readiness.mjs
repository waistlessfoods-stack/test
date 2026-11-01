// Read-only published Contentful audit. No edits/publication; output contains
// public titles/counts and missing-field names, never access tokens or recipes.
import 'dotenv/config';
import { createClient } from 'contentful';
import { mkdir, writeFile } from 'node:fs/promises';
import { sourceLoader } from './lib/load-typescript.mjs';

const accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN || process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN;
const space = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
if (!accessToken || !space) throw new Error('Contentful delivery access is not configured.');
const client = createClient({ accessToken, space });
const responses = await Promise.allSettled([
  client.getEntries({ content_type: 'recipesPage', limit: 1, include: 4 }),
  client.getEntries({ content_type: 'service', limit: 100, include: 3 }),
]);
if (responses.some(response => response.status !== 'fulfilled')) throw new Error('Published content could not be inspected. No changes were made.');
const recipeResponse = responses[0].value;
if (!recipeResponse.items.length) throw new Error('No published recipes page was found.');
const modules = sourceLoader({ 'next/cache': { unstable_cache: fn => fn }, contentful: { createClient: () => ({ getEntries: async () => recipeResponse }) } });
const originalLog = console.log;
let data;
try { console.log = () => {}; data = await modules('lib/contentful-management.ts').fetchRecipesPageFromContentful(); }
finally { console.log = originalLog; }
const hasText = value => typeof value === 'string' ? Boolean(value.trim()) : Array.isArray(value) ? value.some(hasText) : Boolean(value && typeof value === 'object' && (hasText(value.value) || hasText(value.content)));
const recipes = data.recipes.filter(recipe => recipe.productKind !== 'cooking_class');
const review = recipes.map(recipe => ({ title: recipe.title, slug: recipe.slug, categoryIds: recipe.categoryIds || [], missing: [
  ...((recipe.ingredients?.length || hasText(recipe.ingredientsRichText)) ? [] : ['ingredients']),
  ...((recipe.instructionSteps?.some(step => hasText(step.description)) || hasText(recipe.instructionsRichText)) ? [] : ['instructions']),
  ...(recipe.imagePath ? [] : ['image']),
  ...(recipe.cookTime ? [] : ['cook time']),
  ...(recipe.servingSize ? [] : ['serving size']),
] }));
const report = { inspectedAt: new Date().toISOString(), source: 'Published Contentful delivery entries', noMutations: true,
  note: 'Structural checks only. Existing text, titles, and photos still require Amber’s editorial approval.',
  publishedRecipes: recipes.length,
  categories: data.categories.filter(category => !/cooking.class/i.test(category.name)).map(category => ({ name: category.name, publishedRecipes: review.filter(recipe => recipe.categoryIds.includes(category.id)).length, withIngredientsAndInstructions: review.filter(recipe => recipe.categoryIds.includes(category.id) && !recipe.missing.includes('ingredients') && !recipe.missing.includes('instructions')).length })),
  recipeReview: review.map(({ title, slug, missing }) => ({ title, slug, missing })),
  serviceInstructions: responses[1].value.items.map(entry => ({ slug: entry.fields.slug, title: entry.fields.title, howToBookSteps: Array.isArray(entry.fields.howToBook) ? entry.fields.howToBook.length : 0, sectionCount: entry.fields.detailSections?.sections?.length || 0 })),
};
await mkdir('docs/content-readiness', { recursive: true });
await writeFile('docs/content-readiness/2026-11-01.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
