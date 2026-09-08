// Optional footer text: never show a known placeholder as a real address.
export function isNewsletterAddressReady(value: string): boolean {
  const address = value.trim();
  return address.length >= 8 && address.length <= 500 &&
    !/placeholder|add before sending|qa (sample|address)|<.*>|\[.*\]/i.test(address);
}
