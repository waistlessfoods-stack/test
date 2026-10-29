import WebsiteWalkthrough from "@/components/admin/website-walkthrough";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Website Walkthrough",
  "Website review and proposed ongoing support, following the WaistLess Foods presentation."
);

export default function WalkthroughPage() {
  return <WebsiteWalkthrough />;
}
