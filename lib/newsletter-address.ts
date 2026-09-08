// Placeholder is for administrator previews only, never a subscriber footer.
export const NEWSLETTER_ADDRESS_PLACEHOLDER = '[Business mailing address — add before sending]';

export function isNewsletterAddressReady(value: string): boolean {
  const address = value.trim();
  return address.length >= 8 && address.length <= 500 &&
    !/placeholder|add before sending|qa (sample|address)|<.*>|\[.*\]/i.test(address);
}
