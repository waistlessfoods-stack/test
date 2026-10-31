"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Compass } from "lucide-react";
import WalkthroughScreenshots from "@/components/admin/walkthrough-screenshots";

const stops = [
  {
    id: "consultations",
    title: "Complimentary consultations",
    owner: "Website + Google Calendar",
    description: "A prospect shares their event information on the website, then continues to Google's appointment schedule to choose a consultation time.",
    steps: [
      "Open the homepage and select the complimentary consultation button in the header.",
      "Review the information requested by the form. After submission, Google handles the appointment selection and may ask for information again.",
      "Open Booking Requests to see where the website inquiry is recorded. A saved inquiry alone does not confirm a Google appointment.",
    ],
    links: [{ label: "Open homepage", href: "/" }, { label: "Booking requests", href: "/admin/bookings" }],
    note: "Before launch: complete a booking and confirm that the calendar invitation and Google Meet link arrive.",
  },
  {
    id: "services",
    title: "Private chef & catering requests",
    owner: "Website + Admin",
    description: "These forms collect requests for Amber to review. Customers discuss the details with her before a service is confirmed.",
    steps: [
      "Open each service page and select Request to Book. Review the request form and its Submit Request button.",
      "Use Booking Requests to review incoming inquiries and manage their status.",
      "Edit the gray booking-process information in Contentful when the service process or wording changes.",
    ],
    links: [{ label: "Private chef", href: "/services/private" }, { label: "Catering", href: "/services/catering" }, { label: "Booking requests", href: "/admin/bookings" }],
  },
  {
    id: "classes",
    title: "Private & public cooking classes",
    owner: "Website + Admin",
    description: "Private classes start with an inquiry. Public classes use the Shop experience with class details, dates, and per-seat pricing when enrollment is enabled.",
    steps: [
      "Open Cooking Classes to review Request a Private Class and Explore Public Classes.",
      "Open the public-class Shop view. If enrollment is disabled or no classes are offered, review the unavailable message.",
      "Select Class registrations in the shared Admin tools navigation. Actual classes appear here after an order contains a cooking-class item; private-class enquiries remain in Booking Requests.",
      "Choose Sample walkthrough under Order environment, or use View sample registration in an empty roster. This opens the fictional Fresh Pasta Workshop: Alex Sample, one order, two seats. It does not create a customer, charge, booking, or reserved seat.",
      "Select the class and compare Confirmed seats (2) with Confirmed orders (1). Search for Alex or the sample order number. Use Order status to inspect the filters; the sample has one confirmed order and no pending payment.",
      "Select Export CSV to download the currently filtered sample roster. Clear a search or reset the status if no registrations match. Keep real roster contact details private; they are not marketing consent.",
      "Switch Order environment back to Live registrations for actual paid orders, or Test / QA registrations for sandbox checkout history. The shared navigation also opens bookings, invoices, newsletters, and the walkthrough guide.",
    ],
    links: [{ label: "Cooking classes", href: "/services/cooking-classes" }, { label: "Public-class shop", href: "/shop?category=cooking-classes" }, { label: "Class registrations", href: "/admin/class-rosters" }],
    note: "Public-class enrollment needs a separate readiness review before it is enabled. An empty roster is expected when there are no registrations.",
  },
  {
    id: "recipes",
    title: "Paid recipes & downloads",
    owner: "Contentful + Website",
    description: "Amber can check a complete paid recipe through Admin without buying it. Customers unlock the complete recipe after purchase.",
    steps: [
      "Open Paid Recipe Previews, choose a recipe, and check its ingredients, instructions, photography, and layout.",
      "Review Print / Save PDF in the full recipe view. Customers use this after their purchase unlocks the recipe.",
      "Use Contentful to edit recipe content. A separately designed e-book PDF still needs to be prepared before it can be offered.",
    ],
    links: [{ label: "Paid recipe previews", href: "/admin/recipes" }, { label: "Recipe collection", href: "/recipes" }, { label: "Shop", href: "/shop" }],
  },
  {
    id: "newsletters",
    title: "Newsletters & the member archive",
    owner: "Admin + Member account",
    description: "Newsletter Studio prepares issues for two separate actions: publishing an issue to the member archive and emailing it to opted-in subscribers.",
    steps: [
      "Open Newsletter Studio to create or edit an issue, save it, review the preview, and send an administrator test when ready.",
      "Publish an issue to make it available in the member archive. Publishing does not send the newsletter by email.",
      "To email an issue, prepare the saved issue and audience, review the content, then explicitly confirm each send batch. Automatic scheduling is not enabled.",
      "Open the member archive using a signed-in customer account to see published issues and PDF downloads. Admin access and customer sign-in are separate.",
    ],
    links: [{ label: "Newsletter Studio", href: "/admin/newsletters" }, { label: "Email subscribers", href: "/admin/newsletters/subscribers" }, { label: "Member archive", href: "/account/newsletters" }],
    note: "An account does not automatically subscribe someone to marketing emails. The subscriber send controls deliver real emails.",
  },
  {
    id: "management",
    title: "Invoices, orders & customer reviews",
    owner: "Admin",
    description: "The admin tools help Amber follow up on agreed service work, review website activity, and choose which customer reviews appear publicly.",
    steps: [
      "Open Service Invoices to review the workflow for personalized private-chef and catering invoices, payment links, and balances.",
      "Open Dashboard for recent orders and enquiries, or All Accounts for registered customers.",
      "Open Review Moderation to approve or reject service reviews. Only approved reviews appear on the service pages.",
    ],
    links: [{ label: "Service invoices", href: "/admin/service-invoices" }, { label: "Dashboard", href: "/admin/dashboard" }, { label: "All accounts", href: "/admin/accounts" }, { label: "Review moderation", href: "/admin/reviews" }],
    note: "Before launch: finish the payment-flow checks and confirm the customer and administrator notifications.",
  },
  {
    id: "content",
    title: "Content edits & launch review",
    owner: "Contentful + Admin",
    description: "Use Contentful for website copy, images, recipes, and service information. Use Admin for bookings, newsletters, invoices, registrations, and service reviews.",
    steps: [
      "Open Contentful, select the WaistLess Foods space, and find the content entry you want to change. Publish approved edits, then review the website.",
      "Review the homepage, service text, images, and recipes with Amber. List any remaining content changes during the meeting.",
      "Finish consultation and payment checks, confirm public-class readiness separately, and get Amber's approval before removing the preview restriction.",
    ],
    links: [{ label: "Open Contentful", href: "https://app.contentful.com/" }, { label: "Homepage", href: "/" }, { label: "Services", href: "/services" }, { label: "Storefront settings", href: "/admin/settings" }],
    note: "Storefront Settings manages the available storefront configuration. Content edits belong in Contentful; launch approval is a separate decision.",
  },
];

export default function WebsiteWalkthrough() {
  const [reviewed, setReviewed] = useState<string[]>([]);

  useEffect(() => {
    // Scroll to the requested workflow after the admin sign-in gate opens.
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);

  return (
    <main className="min-h-screen bg-[#f0f5f5] px-4 py-8 text-[#173d40] md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" /> Admin home
        </Link>
        <header className="mt-4 rounded-3xl bg-[#173d40] p-6 text-white md:p-10">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b6dcda]">
            <Compass aria-hidden="true" className="size-4" /> WaistLess Foods · Owner guide
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Your website, step by step.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85">Use this guide during the walkthrough or whenever you need a reminder. Open a page, explore it together, then return here for the next step.</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b6dcda]">Each workflow includes screenshots with step numbers. Live screens, sample data, and simulated test results are labelled. Use the check notes to see what still needs verification.</p>
          <p className="mt-4 text-sm leading-6 text-[#b6dcda]">Page links open in a new tab. Customer pages may ask for the website preview password or customer sign-in. Contentful has its own sign-in.</p>
        </header>

        <section aria-label="Where to manage things" className="my-6 grid gap-3 md:grid-cols-3">
          {[
            ["Website", "What customers see: services, requests, recipes, classes, and their member account."],
            ["Admin", "What Amber manages: enquiries, invoices, registrations, reviews, and newsletters."],
            ["Contentful", "What Amber edits: website wording, photography, recipes, and service content."],
          ].map(([title, text]) => <div key={title} className="rounded-2xl border border-[#d5e3df] bg-white p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#d5e3df] bg-white p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold">Walkthrough stops</h2>
            <nav aria-label="Walkthrough sections" className="mt-3 flex flex-col gap-1">
              {stops.map((stop, index) => <a key={stop.id} href={`#${stop.id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm leading-5 hover:bg-[#f0f5f5]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf4f2] text-xs font-semibold">{reviewed.includes(stop.id) ? <Check aria-label="Reviewed" className="size-4" /> : index + 1}</span>{stop.title}</a>)}
            </nav>
            <div className="mt-5 border-t border-[#d5e3df] pt-4">
              <p role="status" className="text-sm font-semibold">{reviewed.length} of {stops.length} reviewed</p>
              <progress aria-label="Walkthrough progress" value={reviewed.length} max={stops.length} className="mt-3 h-2 w-full accent-[#388082]" />
              <p className="mt-2 text-xs leading-5 text-slate-500">Ticks are meeting reminders for this visit. They do not mark launch checks complete.</p>
              <button type="button" onClick={() => setReviewed([])} className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4">Reset ticks</button>
            </div>
          </aside>

          <div id="website-tour" className="min-w-0 scroll-mt-6 space-y-5">
            {stops.map((stop, index) => (
              <section key={stop.id} id={stop.id} aria-labelledby={`${stop.id}-title`} className="scroll-mt-6 rounded-2xl border border-[#d5e3df] bg-white p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#367577]">Stop {index + 1} · {stop.owner}</p>
                <h2 id={`${stop.id}-title`} className="mt-3 text-2xl font-semibold tracking-tight">{stop.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{stop.description}</p>
                <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
                  {stop.steps.map(step => <li key={step} className="pl-1">{step}</li>)}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2">
                  {stop.links.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#edf4f2] px-4 py-3 text-sm font-semibold text-[#245e60] transition-colors hover:bg-[#dceae5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#367577]">{link.label}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /><span className="sr-only"> (opens in a new tab)</span></a>)}
                </div>
                {stop.note && <p className="mt-5 rounded-xl border border-[#e9dfbd] bg-[#fcf9ef] p-4 text-sm leading-6 text-[#695523]">{stop.note}</p>}
                <WalkthroughScreenshots section={stop.id} />
                <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 border-t border-[#e2ebe7] pt-5 text-sm font-medium">
                  <input type="checkbox" checked={reviewed.includes(stop.id)} onChange={event => setReviewed(current => event.target.checked ? [...current, stop.id] : current.filter(id => id !== stop.id))} className="size-5 shrink-0 accent-[#388082]" />
                  We reviewed {stop.title.toLowerCase()}
                </label>
              </section>
            ))}
            <p className="px-2 pb-4 text-sm leading-6 text-slate-500">This guide explains the workflows. Confirm final booking, payment, content, and launch decisions together during the review.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
