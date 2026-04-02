"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useSession } from "@/lib/auth-client";
import type { Recipe } from "@/lib/contentful-management";

type RecipeDetailClientProps = {
  recipe: Recipe;
};

export default function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { data: session, isPending } = useSession();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (isPending || !session?.user?.id) {
      return;
    }

    let isActive = true;

    const normalize = (value: string) =>
      value.trim().toLowerCase().replace(/\s+/g, " ");

    const checkUnlockedStatus = async () => {
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const completedOrders = (payload.orders || []).filter(
          (order: { status?: string }) => order.status === "completed"
        );

        const isUnlocked = completedOrders.some(
          (order: { items?: Array<{ id?: string; slug?: string; name?: string }> }) =>
            (order.items || []).some(
              (item) =>
                item.id === recipe.id ||
                item.slug === recipe.slug ||
                (typeof item.name === "string" &&
                  normalize(item.name) === normalize(recipe.title))
            )
        );

        if (isUnlocked && isActive) {
          router.replace(`/recipes/detail/${recipe.slug}/full`);
        }
      } catch {
        // Keep preview page visible if unlock check fails temporarily.
      }
    };

    void checkUnlockedStatus();

    return () => {
      isActive = false;
    };
  }, [session?.user?.id, isPending, recipe.id, recipe.slug, recipe.title, router]);

  const handleAddToCart = () => {
    try {
      setIsAddingToCart(true);
      const priceValue = parseFloat(
        recipe.price.toString().replace(/[^0-9.-]+/g, "")
      );

      addItem({
        id: recipe.id,
        name: recipe.title,
        slug: recipe.slug,
        price: isNaN(priceValue) ? 0 : priceValue,
        quantity: 1,
        imagePath: recipe.imagePath,
      });

      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setIsAddingToCart(false);
    }
  };

  const handleOrderNow = () => {
    if (!session?.user) {
      router.push(
        `/signin?redirect=/recipes/detail/${recipe.slug}&message=Please sign in to purchase this recipe`
      );
      return;
    }

    try {
      const priceValue = parseFloat(
        recipe.price.toString().replace(/[^0-9.-]+/g, "")
      );

      addItem({
        id: recipe.id,
        name: recipe.title,
        slug: recipe.slug,
        price: isNaN(priceValue) ? 0 : priceValue,
        quantity: 1,
        imagePath: recipe.imagePath,
      });

      router.push("/shop");
    } catch (error) {
      console.error("Error in order now:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      <section className="w-full py-16 2xl:py-12">
        <Container>
          <Link href="/recipes" className="mb-8 inline-block">
            <div className="flex items-center gap-4 hover:opacity-70 transition-opacity">
              <span className="text-xl 2xl:text-lg font-medium text-[#0F8DAB]">
                Recipes
              </span>
              <span className="text-xl 2xl:text-lg text-black">/</span>
              <span className="text-xl 2xl:text-lg font-medium text-black">
                Detail recipes
              </span>
            </div>
          </Link>

          <div className="flex flex-col lg:flex-row gap-14 2xl:gap-8">
            <div className="w-full lg:w-1/2 flex items-center">
              <div className="relative w-full aspect-square lg:aspect-auto lg:h-[642px] rounded-lg overflow-hidden bg-[#E9E9E9] shadow-lg">
                {recipe.imagePath && (
                  <Image
                    src={recipe.imagePath}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col gap-12 2xl:gap-8 justify-start">
              <h1 className="font-metropolis font-medium text-5xl 2xl:text-4xl text-black leading-tight">
                {recipe.title}
              </h1>

              <div className="flex flex-col gap-5 2xl:gap-4">
                <h3 className="font-medium text-2xl 2xl:text-xl text-black">
                  Description
                </h3>
                <p className="font-normal text-xl 2xl:text-lg text-gray-600 leading-relaxed">
                  {recipe.detailDescription || recipe.description}
                </p>
              </div>

              <div className="bg-[#F7F7F7] rounded-lg p-5 2xl:p-4">
                <div className="flex flex-col gap-5 2xl:gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xl 2xl:text-lg text-gray-700">
                      Price :
                    </span>
                    <span className="font-bold text-4xl 2xl:text-3xl text-black">
                      {recipe.price}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 2xl:gap-2 w-full">
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="flex-1 h-14 2xl:h-12 bg-[#FB7118] hover:bg-[#E86510] text-white font-medium text-lg 2xl:text-base rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isAddingToCart ? "Adding..." : "Add to cart"}
                    </Button>
                    <Button
                      onClick={handleOrderNow}
                      className="flex-1 h-14 2xl:h-12 bg-[#388082] hover:bg-[#2F6A6B] text-white font-medium text-lg 2xl:text-base rounded-lg transition-colors"
                    >
                      Order now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
