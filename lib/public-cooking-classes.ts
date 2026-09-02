import "server-only";

export function arePublicCookingClassesEnabled(): boolean {
  return process.env.PUBLIC_COOKING_CLASSES_ENABLED === "true";
}
