import { isCookingClassProduct, type Recipe } from '@/lib/contentful-management';

export type ShopView = 'all' | 'recipes' | 'classes';
export function normalizeShopCategory(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function filterShopItems(items: Recipe[], view: ShopView, categories: Set<string>, query: string) {
  const search = query.trim().toLowerCase();
  return items.filter(item => {
    if (!item.price || item.price.toLowerCase() === 'free') return false;
    const isClass = isCookingClassProduct(item);
    if (view === 'classes' && !isClass) return false;
    if (view === 'recipes' && isClass) return false;
    if (!isClass && categories.size && !(item.categoryIds ?? []).some(id => categories.has(id))) return false;
    return !search || [item.title, item.description, isClass ? item.eventDate : '', isClass ? item.duration : ''].filter(Boolean).join(' ').toLowerCase().includes(search);
  });
}
