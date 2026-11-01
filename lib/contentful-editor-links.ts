import "server-only";

export function contentfulEntryEditorUrl(id: string): string | null {
  const space = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  if (!space || !id) return null;
  // The delivery client currently reads Contentful's default master environment.
  return `https://app.contentful.com/spaces/${encodeURIComponent(space)}/environments/master/entries/${encodeURIComponent(id)}`;
}
