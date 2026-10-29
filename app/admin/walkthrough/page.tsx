import WebsiteWalkthrough from "@/components/admin/website-walkthrough";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Website Walkthrough",
  "A guided tour of the WaistLess Foods website and administration tools."
);

export default function WalkthroughPage() {
  return <WebsiteWalkthrough />;
}
