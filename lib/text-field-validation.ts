type TextFieldLimit = {
  label: string;
  max: number;
};

export function validateTextFieldLengths(
  body: unknown,
  limits: Record<string, TextFieldLimit>
): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const values = body as Record<string, unknown>;

  for (const [field, limit] of Object.entries(limits)) {
    const value = values[field];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (typeof value !== "string") {
      return `${limit.label} must be text`;
    }

    if (value.length > limit.max) {
      return `${limit.label} must be ${limit.max} characters or fewer`;
    }
  }

  return null;
}
