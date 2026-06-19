import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blogs Redirect",
  description: "Legacy blog redirect route.",
  path: "/blogs",
  noIndex: true,
});

export default function BlogsRedirectPage() {
  redirect("/blog");
}
