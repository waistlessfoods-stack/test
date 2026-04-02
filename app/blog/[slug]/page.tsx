import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { fetchBlogPageFromContentful } from "@/lib/contentful-blog";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const data = await fetchBlogPageFromContentful();
  const post = data.posts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="bg-[#f4f4f4] py-16 md:py-20">
      <Container className="max-w-5xl">
        <Link
          href="/blog"
          className="mb-8 inline-flex text-sm font-semibold uppercase tracking-wider text-[#00676E] hover:opacity-75"
        >
          Back to blogs
        </Link>

        <article className="overflow-hidden rounded-xl border border-[#e6e6e6] bg-white shadow-[0_30px_70px_-40px_rgba(0,0,0,0.55)]">
          <div className="relative aspect-[16/8] w-full">
            {post.imagePath && (
              <Image
                src={post.imagePath}
                alt={post.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            )}
          </div>

          <div className="space-y-6 p-8 md:p-12">
            <p className="text-sm font-medium text-[#6d6d6d]">
              {post.readTimeMinutes} min read · {post.category}
            </p>

            <h1 className="font-bebas text-5xl leading-none text-black md:text-6xl">
              {post.title}
            </h1>

            <p className="text-lg leading-8 text-[#262626]">{post.excerpt}</p>
          </div>
        </article>
      </Container>
    </main>
  );
}
