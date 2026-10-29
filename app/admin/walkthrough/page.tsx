import WebsiteWalkthrough from "@/components/admin/website-walkthrough";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Website Walkthrough",
  "A practical guide to the WaistLess Foods website, Contentful, and administration tools."
);

export default function WalkthroughPage() {
  return <WebsiteWalkthrough />;
}
