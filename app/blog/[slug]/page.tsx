import type { Metadata } from "next";
import JsonLd from "@/components/seo/json-ld";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { MarkdownContent } from "@/components/markdown-content";
import { fetchBlogPostBySlugFromContentful } from "@/lib/contentful-blog";
import { buildMetadata, toAbsoluteUrl } from "@/lib/seo";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlugFromContentful(slug);

  if (!post) {
    return buildMetadata({
      title: "Blog Post Not Found",
      description: "This blog post could not be found.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.imagePath,
    openGraphType: "article",
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await fetchBlogPostBySlugFromContentful(slug);

  if (!post) {
    notFound();
  }

  const postUrl = toAbsoluteUrl(`/blog/${post.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      articleSection: post.category,
      datePublished: post.publishedAt || undefined,
      image: post.imagePath || undefined,
      url: postUrl,
      publisher: {
        "@type": "Organization",
        name: "WaistLess Foods",
        logo: {
          "@type": "ImageObject",
          url: toAbsoluteUrl("/logo.png"),
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: toAbsoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: toAbsoluteUrl("/blog"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: postUrl,
        },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
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

              <MarkdownContent content={post.excerpt} className="space-y-6" />
            </div>
          </article>

          <section className="mt-8 rounded-xl border border-[#e2e2e2] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.5)] md:p-8">
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4c8d8f]">
                Keep Exploring
              </p>
              <h2 className="font-bebas text-[34px] leading-[0.95] text-[#111] md:text-[44px]">
                Take the next step from the journal
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[#5d5d5d] md:text-base">
                Move from inspiration into action with chef services, premium
                recipes, or more food and wellness stories.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Link
                href="/services"
                className="rounded-xl border border-[#d9d9d9] bg-[#f8f8f8] px-4 py-4 text-sm font-semibold text-[#202020] transition hover:border-[#4c8d8f] hover:bg-white"
              >
                Explore services
              </Link>
              <Link
                href="/recipes"
                className="rounded-xl border border-[#d9d9d9] bg-[#f8f8f8] px-4 py-4 text-sm font-semibold text-[#202020] transition hover:border-[#4c8d8f] hover:bg-white"
              >
                Browse recipes
              </Link>
              <Link
                href="/shop"
                className="rounded-xl border border-[#d9d9d9] bg-[#f8f8f8] px-4 py-4 text-sm font-semibold text-[#202020] transition hover:border-[#4c8d8f] hover:bg-white"
              >
                Visit premium shop
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}
