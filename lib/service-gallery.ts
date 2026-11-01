type GalleryFields = { subImages?: unknown; galleryImages?: unknown; galleryImagePaths?: unknown };

function imageUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const file = (value as { fields?: { file?: { url?: unknown; contentType?: unknown } } }).fields?.file;
  if (typeof file?.url !== 'string' || (typeof file.contentType === 'string' && !file.contentType.startsWith('image/'))) return null;
  return file.url.startsWith('//') ? `https:${file.url}` : file.url;
}

export function serviceGalleryImagePaths(fields: GalleryFields): string[] {
  // Sub Images is the current Contentful field. An explicit empty list means
  // remove the gallery; older fields must not silently restore old photos.
  if (Array.isArray(fields.subImages)) return [...new Set(fields.subImages.map(imageUrl).filter((url): url is string => Boolean(url)))];
  if (Array.isArray(fields.galleryImages)) return [...new Set(fields.galleryImages.map(imageUrl).filter((url): url is string => Boolean(url)))];
  return Array.isArray(fields.galleryImagePaths) ? [...new Set(fields.galleryImagePaths.filter((url): url is string => typeof url === 'string' && Boolean(url.trim())).map(url => url.trim()))] : [];
}

export function serviceGalleryPhotos(main: string | null, gallery: (string | null)[]): string[] {
  return [...new Set([main, ...gallery].filter((url): url is string => Boolean(url)))];
}
