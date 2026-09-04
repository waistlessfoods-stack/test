type CookingClassCapacityInput = {
  title: string;
  capacity: number;
  soldQuantity: number;
  requestedQuantity: number;
};

export function getCookingClassAvailabilityError({
  title,
  capacity,
  soldQuantity,
  requestedQuantity,
}: CookingClassCapacityInput): string | null {
  const availableQuantity = Math.max(capacity - soldQuantity, 0);

  if (requestedQuantity <= availableQuantity) {
    return null;
  }

  if (availableQuantity === 0) {
    return `${title} is sold out.`;
  }

  return `Only ${availableQuantity} seat${availableQuantity === 1 ? " is" : "s are"} still available for ${title}.`;
}
