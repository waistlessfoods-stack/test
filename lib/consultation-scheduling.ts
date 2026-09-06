// Amber's public appointment page; this URL contains no credentials.
const DEFAULT_CONSULTATION_BOOKING_URL =
  "https://calendar.app.google/MYtW3RKs8Q12FqZA8";

export function getConsultationBookingUrl(configuredUrl?: string): string {
  const value = configuredUrl?.trim();
  if (value) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:") return url.href;
    } catch {
      // Keep scheduling available if a deployment variable is absent or invalid.
    }
  }
  return DEFAULT_CONSULTATION_BOOKING_URL;
}
