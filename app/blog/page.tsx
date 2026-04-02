import { fetchBlogPageFromContentful } from "@/lib/contentful-blog";
import BlogPageClient from "./blog-page-client";

export const revalidate = 300;

export default async function BlogPage() {
  const data = await fetchBlogPageFromContentful();
  return <BlogPageClient data={data} />;
}
