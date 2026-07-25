"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlogPageData } from "@/lib/contentful-blog";

type BlogPageClientProps = {
  data: BlogPageData;
};

export default function BlogPageClient({ data }: BlogPageClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [readTime, setReadTime] = useState("all");

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.posts.filter((post) => {
      const queryMatch =
        !normalizedQuery ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.excerpt.toLowerCase().includes(normalizedQuery) ||
        post.category.toLowerCase().includes(normalizedQuery);

      const categoryMatch =
        category === "all" || post.category.toLowerCase() === category;

      const readTimeMatch =
        readTime === "all" || post.readTimeMinutes === Number(readTime);

      return queryMatch && categoryMatch && readTimeMatch;
    });
  }, [category, data.posts, query, readTime]);

  return (
    <main className="bg-[#ececec]">
      <section className="py-10 md:py-14">
        <Container className="mx-auto flex max-w-[1180px] flex-col gap-6 md:gap-8">
          <header className="space-y-2 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4c8d8f]">
              WaistLess Foods Journal
            </p>
            <h1 className="font-bebas text-[44px] leading-[0.95] text-[#111] md:text-[64px]">
              {data.heading}
            </h1>
          </header>

          <div className="grid gap-2.5 md:grid-cols-[1fr_165px_165px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#9b9b9b]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={data.searchPlaceholder}
                className="h-11 rounded-[2px] border-[#dddddd] bg-white pl-9 pr-3 text-[13px] text-[#303030] shadow-none placeholder:text-[#acacac] focus-visible:border-[#bcbcbc] focus-visible:ring-0"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">{data.categoryFilterLabel}</span>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value)}
              >
                <SelectTrigger className="h-11 rounded-[2px] border-[#dddddd] bg-white px-3 text-[11px] font-semibold text-[#3c3c3c] shadow-none focus:border-[#bcbcbc] focus:ring-0">
                  <SelectValue placeholder={data.categoryFilterLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{data.categoryFilterLabel}</SelectItem>
                  {data.categories.map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="relative block">
              <span className="sr-only">{data.readTimeFilterLabel}</span>
              <Select
                value={readTime}
                onValueChange={(value) => setReadTime(value)}
              >
                <SelectTrigger className="h-11 rounded-[2px] border-[#dddddd] bg-white px-3 text-[11px] font-semibold text-[#3c3c3c] shadow-none focus:border-[#bcbcbc] focus:ring-0">
                  <SelectValue placeholder={data.readTimeFilterLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{data.readTimeFilterLabel}</SelectItem>
                  {data.readTimeOptions.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} min read
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-3">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-[5px] border border-[#dcdcdc] bg-[#e8e8e8] shadow-[0_8px_14px_-16px_rgba(0,0,0,0.55)] transition-all duration-300 hover:bg-[#eeeeee] hover:shadow-[0_14px_30px_-20px_rgba(0,0,0,0.7)]"
              >
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <div className="relative aspect-square overflow-hidden bg-[#efefef]">
                    <Image
                      src={post.imagePath}
                      alt={post.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-3 opacity-0 transition-all duration-300 group-hover:-translate-y-1/2 group-hover:opacity-100">
                      <span className="inline-flex items-center justify-center rounded-md border border-white/80 bg-white/20 px-8 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-sm">
                        Read More
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 px-4 pb-4 pt-3.5">
                    <p className="text-[12px] font-medium text-[#8a8a8a]">
                      {post.readTimeMinutes} min read · {post.category}
                    </p>
                    <h2 className="text-[16px] font-semibold leading-[1.2] text-[#151515]">
                      {post.title}
                    </h2>
                    <p className="text-[13px] leading-5 text-[#2f2f2f]">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="rounded-[2px] border border-dashed border-[#cfcfcf] bg-white p-10 text-center">
              <p className="text-base font-semibold text-[#222]">No articles found.</p>
              <p className="mt-2 text-sm text-[#6d6d6d]">
                Try another search term or clear your filters.
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
