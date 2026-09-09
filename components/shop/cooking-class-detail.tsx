'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChefHat, ShoppingBag } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { ClassFacts } from '@/components/shop/cooking-class-card';
import type { Recipe } from '@/lib/contentful-management';

export default function CookingClassDetail({ item, onAddSeat, adding }: { item: Recipe; onAddSeat: () => void; adding: boolean }) {
  return (
    <div className="min-h-screen bg-[#faf8f3] font-metropolis">
      <Container className="py-8 sm:py-12">
        <Link href="/shop?category=cooking-classes" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#00676e]"><ArrowLeft aria-hidden="true" className="size-4" />All cooking classes</Link>
        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e4eeea]">
              {(item.heroImagePath || item.imagePath) ? <Image src={(item.heroImagePath || item.imagePath)!} alt={item.title} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><ChefHat aria-hidden="true" className="size-20 text-[#388082]" /></div>}
            </div>
          </div>
          <div className="min-w-0 lg:col-start-2 lg:row-span-2">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#00676e]"><ChefHat aria-hidden="true" className="size-4" />Public cooking class</p>
            <h1 className="mb-6 break-words font-serif text-4xl leading-tight text-[#183e40] sm:text-5xl">{item.title}</h1>
            <div className="mb-8 border-y border-[#d5e3df] py-6"><ClassFacts item={item} /></div>
            <section aria-label="Class registration" className="rounded-2xl border border-[#d5e3df] bg-white p-6 sm:p-8">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#388082]">Your seat at the table</p>
              <p className="mb-6 flex flex-wrap items-baseline gap-2"><span className="text-4xl font-semibold text-[#183e40]">{item.price}</span><span className="text-sm text-[#586c6a]">per seat</span></p>
              <Button onClick={onAddSeat} disabled={adding} className="h-12 w-full bg-[#00676e] text-white hover:bg-[#00545a]"><ShoppingBag aria-hidden="true" className="size-4" />{adding ? 'Adding seat…' : 'Add seat to cart'}</Button>
              <p role="status" className="mt-3 text-sm leading-6 text-[#586c6a]">{adding ? 'Seat added. Open Cart to review your quantity and check out.' : 'Choose your seat quantity in Cart. Availability is checked at checkout; adding to Cart does not reserve a seat.'}</p>
              <p className="mt-4 border-t border-[#e4e9e4] pt-4 text-xs leading-5 text-[#586c6a]">Your registration is confirmed after successful payment. This is a class ticket, not a downloadable recipe.</p>
            </section>
            <p className="mt-6 text-sm leading-6 text-[#586c6a]">Prefer a class for your own group? <Link href="/services/cooking-classes" className="font-semibold text-[#00676e] underline">Explore private classes</Link></p>
          </div>
          <div className="min-w-0 rounded-xl border border-[#d5e3df] bg-white p-6 lg:col-start-1 lg:row-start-2">
            <h2 className="mb-3 font-serif text-2xl text-[#183e40]">About this class</h2>
            <p className="whitespace-pre-wrap break-words text-base leading-7 text-[#586c6a]">{item.detailDescription || item.description}</p>
          </div>
        </div>
      </Container>
    </div>
  );
}
