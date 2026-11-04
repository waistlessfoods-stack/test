export const MAX_SIGNATURE_DATA_LENGTH = 200000;
export type SignatureMark = { method: "typed" } | { method: "drawn" | "uploaded"; imageData: string };
export function parseSignatureMark(value: unknown): SignatureMark {
  if (value === undefined) return { method: "typed" }; // Existing callers remain supported.
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Choose a signature method.");
  const mark = value as Record<string, unknown>;
  if (mark.method === "typed" && mark.imageData === undefined) return { method: "typed" };
  if ((mark.method !== "drawn" && mark.method !== "uploaded") || typeof mark.imageData !== "string" ||
    mark.imageData.length > MAX_SIGNATURE_DATA_LENGTH || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(mark.imageData)) {
    throw new Error("Draw a signature or upload a valid signature image before signing.");
  }
  return { method: mark.method, imageData: mark.imageData };
}
