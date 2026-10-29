"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import evidence from "@/lib/walkthrough-evidence.json";

export default function WalkthroughScreenshots({ section }: { section: string }) {
  const images = evidence.screenshots.filter(screenshot => screenshot.section === section);
  const [selected, setSelected] = useState(0);
  const screenshot = images[selected];
  const verification = evidence.sections.find(item => item.id === section);
  if (!screenshot) return null;
  const imageUrl = `/api/admin/walkthrough-images/${encodeURIComponent(screenshot.file)}`;

  return (
    <div className="mt-7 min-w-0 border-t border-[#dce8e5] pt-6" aria-label={`${section} screenshot guide`}>
      <h3 className="font-semibold text-[#173d40]">See the steps on screen</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">Choose a screenshot to see the page or tested state. Open the image to read it at full size.</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label={`${section} screenshots`}>
        {images.map((item, index) => (
          <button key={item.file} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`min-h-11 max-w-56 shrink-0 rounded-lg border px-3 py-2 text-left text-xs leading-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#367577] ${selected === index ? "border-[#367577] bg-[#edf4f2] text-[#173d40]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <span className="block font-semibold">Step {item.step}</span>{item.title}
          </button>
        ))}
      </div>
      <figure className="mt-3 overflow-hidden rounded-xl border border-[#d5e3df] bg-[#f5f7f5]">
        <a href={imageUrl} target="_blank" rel="noopener" aria-label={`Open full-size image: ${screenshot.title} (opens in a new tab)`} className="block p-2 focus-visible:outline-2 focus-visible:outline-[#367577]">
          <Image key={screenshot.file} src={imageUrl} alt={`${screenshot.title}. ${screenshot.caption}`} width={screenshot.width} height={screenshot.height} unoptimized className="mx-auto h-auto max-h-[440px] w-auto max-w-full object-contain" />
        </a>
        <figcaption className="border-t border-[#d5e3df] bg-white p-4">
          <p className="text-xs font-semibold text-[#367577]">{screenshot.kind} · Captured {screenshot.capturedOn}</p>
          <p className="mt-2 text-sm font-semibold text-[#173d40]">{screenshot.title}</p>
          <p className="mt-1 text-xs leading-6 text-slate-600">{screenshot.caption}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <a href={imageUrl} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#367577] underline underline-offset-4">Open full-size image<ArrowUpRight className="size-3" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
            <div className="flex items-center gap-2">
              <button type="button" aria-label={`Previous ${section} screenshot`} disabled={selected === 0} onClick={() => setSelected(index => index - 1)} className="inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30"><ChevronLeft aria-hidden="true" className="size-4" /></button>
              <span className="text-xs text-slate-500" aria-live="polite">{selected + 1} / {images.length}</span>
              <button type="button" aria-label={`Next ${section} screenshot`} disabled={selected === images.length - 1} onClick={() => setSelected(index => index + 1)} className="inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30"><ChevronRight aria-hidden="true" className="size-4" /></button>
            </div>
          </div>
        </figcaption>
      </figure>
      {verification && <details className="mt-4 rounded-xl border border-[#dce8e5] bg-[#f7faf8] p-4 text-xs leading-6 text-slate-600"><summary className="cursor-pointer font-semibold text-[#173d40]">What was checked and what remains</summary><p className="mt-3"><strong>Checked:</strong> {verification.checked}</p><p className="mt-2"><strong>Still to verify:</strong> {verification.remaining}</p></details>}
    </div>
  );
}
