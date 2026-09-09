import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, ChefHat, Clock3, Users } from 'lucide-react';
import type { Recipe } from '@/lib/contentful-management';

export function ClassFacts({ item }: { item: Recipe }) {
  return (
    <dl className="grid gap-3 text-sm text-[#405f60]">
      <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#00676e]" /><dt className="sr-only">Class date and time</dt><dd className="min-w-0 break-words">{item.eventDate || 'Schedule to be announced'}</dd></div>
      {(item.duration || item.cookTime) && <div className="flex items-center gap-3"><Clock3 aria-hidden="true" className="size-4 shrink-0 text-[#00676e]" /><dt className="sr-only">Duration</dt><dd>{item.duration || item.cookTime}</dd></div>}
      {item.capacity && <div className="flex items-center gap-3"><Users aria-hidden="true" className="size-4 shrink-0 text-[#00676e]" /><dt className="sr-only">Class capacity</dt><dd>Up to {item.capacity} participants</dd></div>}
    </dl>
  );
}

export default function CookingClassCard({ item }: { item: Recipe }) {
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d5e3df] bg-white" aria-label={`Cooking class: ${item.title}`}>
      <Link href={`/shop/${item.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-[#e4eeea] focus-visible:outline-4 focus-visible:outline-[#00676e]">
        {item.imagePath ? <Image src={item.imagePath} alt={item.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><ChefHat aria-hidden="true" className="size-16 text-[#388082]" /><span className="sr-only">Class image coming soon</span></div>}
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#00676e]"><ChefHat aria-hidden="true" className="size-4" />Public cooking class</span>
      </Link>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="mb-3 break-words font-serif text-2xl leading-tight text-[#183e40] sm:text-3xl"><Link href={`/shop/${item.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-[#00676e]">{item.title}</Link></h3>
        <p className="mb-6 line-clamp-3 text-sm leading-6 text-[#586c6a]">{item.description}</p>
        <ClassFacts item={item} />
        <div className="mt-auto pt-6"><div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e4e9e4] pt-5">
          <p className="flex flex-wrap items-baseline gap-x-2"><span className="text-2xl font-semibold text-[#183e40]">{item.price}</span><span className="text-xs text-[#586c6a]">per seat</span></p>
          <Link href={`/shop/${item.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#00676e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#00545a]">View class <ArrowUpRight aria-hidden="true" className="size-4" /><span className="sr-only">: {item.title}</span></Link>
        </div></div>
      </div>
    </article>
  );
}
