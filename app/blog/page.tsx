import { fetchBlogPageFromContentful } from "@/lib/contentful-blog";
import { buildMetadata } from "@/lib/seo";
import BlogPageClient from "./blog-page-client";

export const revalidate = 300;

export async function generateMetadata() {
  const data = await fetchBlogPageFromContentful();

  return buildMetadata({
    title: data.heading || "Blog",
    description:
      "Stories, news, and sustainable food insights from WaistLess Foods.",
    path: "/blog",
  });
}

export default async function BlogPage() {
  const data = await fetchBlogPageFromContentful();
  return <BlogPageClient data={data} />;
}
