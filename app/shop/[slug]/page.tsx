import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import JsonLd from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import RecipeDetailClient from "@/app/recipes/detail/[slug]/recipe-detail-client";
import {
  fetchShopPageFromContentful,
  findRecipeBySlug,
  isCookingClassProduct,
} from "@/lib/contentful-management";
import { buildMetadata, toAbsoluteUrl } from "@/lib/seo";
import { arePublicCookingClassesEnabled } from "@/lib/public-cooking-classes";

export const revalidate = 300;

type ShopProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ShopProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchShopPageFromContentful();
  const product = findRecipeBySlug(data.recipes, slug);

  if (
    !product ||
    (isCookingClassProduct(product) && !arePublicCookingClassesEnabled())
  ) {
    return buildMetadata({
      title: "Shop Item Not Found",
      description: "This shop item could not be found.",
      path: `/shop/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: product.title,
    description: product.detailDescription || product.description,
    path: `/shop/${product.slug}`,
    image: product.heroImagePath || product.imagePath,
  });
}

export default async function ShopProductPage({ params }: ShopProductPageProps) {
  const { slug } = await params;
  const data = await fetchShopPageFromContentful();
  const product = findRecipeBySlug(data.recipes, slug);

  if (
    !product ||
    (isCookingClassProduct(product) && !arePublicCookingClassesEnabled())
  ) {
    return (
      <div className="min-h-screen bg-white">
        <Container className="py-20 text-center">
          <h1 className="mb-3 text-3xl font-bold text-black">
            Shop item not found
          </h1>
          <Link href="/shop" className="text-[#0F8DAB] underline">
            Back to the shop
          </Link>
        </Container>
      </div>
    );
  }

  if (product.slug !== slug) {
    redirect(`/shop/${product.slug}`);
  }

  const productUrl = toAbsoluteUrl(`/shop/${product.slug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.detailDescription || product.description,
          image: product.heroImagePath || product.imagePath || undefined,
          url: productUrl,
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product.price.replace(/[^0-9.]/g, ""),
            availability: "https://schema.org/InStock",
            url: productUrl,
          },
        }}
      />
      <RecipeDetailClient recipe={product} source="shop" />
    </>
  );
}
