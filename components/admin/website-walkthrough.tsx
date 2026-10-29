"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, Check, Compass } from "lucide-react";

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
      "Use Class Registrations to view purchasers and confirmed seats, and download a class roster when registrations exist.",
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

const presentationSections = [
  { id: "overview", title: "More time for WaistLess Foods" },
  { id: "website-tools", title: "The website tools we can put to work" },
  { id: "website-tour", title: "Live website walkthrough" },
  { id: "recurring-work", title: "The recurring work around your website" },
  { id: "team", title: "One contact, a team behind the work" },
  { id: "newsletter-example", title: "One newsletter can support several updates" },
  { id: "working-together", title: "How we would work together" },
  { id: "support-options", title: "Monthly support options to discuss" },
  { id: "trial", title: "A three-month trial" },
  { id: "launch-closeout", title: "Launch closeout and ongoing support" },
  { id: "next-steps", title: "What would you like to hand over?" },
];

function PresentationSection({ slide, children }: { slide: number; children: ReactNode }) {
  const section = presentationSections[slide - 1];
  return (
    <section id={section.id} aria-labelledby={`${section.id}-title`} className="min-w-0 scroll-mt-6 rounded-2xl border border-[#d5e3df] bg-white p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#367577]">Presentation slide {slide}</p>
      <h2 id={`${section.id}-title`} className="mt-3 text-2xl font-semibold tracking-tight">{section.title}</h2>
      <div className="mt-5 space-y-5 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}

function DiscussionTable({ headings, rows }: { headings: string[]; rows: string[][] }) {
  return (
    <div>
    <div className="overflow-x-auto rounded-xl border border-[#d5e3df]" role="region" aria-label={headings.join(" and ")} tabIndex={0}>
      <table className={`w-full text-left text-sm leading-6 ${headings.length > 2 ? "min-w-[480px]" : ""}`}>
        <thead className="bg-[#173d40] text-white"><tr>{headings.map(heading => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#d5e3df]">{rows.map((row, index) => <tr key={row[0]} className={index % 2 ? "bg-[#f0f5f5]" : "bg-white"}>{row.map((value, column) => column === 0 ? <th key={column} scope="row" className="px-4 py-3 font-medium text-[#173d40]">{value}</th> : <td key={column} className="px-4 py-3">{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
    {headings.length > 2 && <p className="mt-2 text-xs text-slate-500 sm:hidden">Scroll the table sideways to compare both options.</p>}
    </div>
  );
}

export default function WebsiteWalkthrough() {
  const [reviewed, setReviewed] = useState<string[]>([]);

  useEffect(() => {
    // The requested section appears after the admin sign-in gate has opened.
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);

  return (
    <main className="min-h-screen bg-[#f0f5f5] px-4 py-8 text-[#173d40] md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" /> Admin home
        </Link>
        <header id="overview" className="mt-4 scroll-mt-6 rounded-3xl bg-[#173d40] p-6 text-white md:p-10">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b6dcda]">
            <Compass aria-hidden="true" className="size-4" /> WaistLess Foods · Presentation slide 1
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">More time for WaistLess Foods</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85">Website review and ongoing support. Follow the same order as the presentation: review the website, explore the tasks Amber could hand over, and discuss optional monthly support.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#website-tour" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#173d40] hover:bg-[#edf4f2]">Start the website demo · Slide 3</a>
            <a href="#support-options" className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 py-3 text-sm font-semibold hover:bg-white/10">Discuss support options · Slide 8</a>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#b6dcda]">Page links open in a new tab. Customer pages may ask for the website preview password or customer sign-in. Contentful has its own sign-in.</p>
        </header>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#d5e3df] bg-white p-5 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
            <h2 className="font-semibold">Presentation order</h2>
            <nav aria-label="Presentation sections" className="mt-3 flex flex-col gap-1">
              {presentationSections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm leading-5 hover:bg-[#f0f5f5]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf4f2] text-xs font-semibold">{index + 1}</span>{section.title}</a>)}
            </nav>
            <div className="mt-5 border-t border-[#d5e3df] pt-4">
              <p role="status" className="text-sm font-semibold">{reviewed.length} of {stops.length} website workflows reviewed</p>
              <progress aria-label="Walkthrough progress" value={reviewed.length} max={stops.length} className="mt-3 h-2 w-full accent-[#388082]" />
              <p className="mt-2 text-xs leading-5 text-slate-500">Ticks are meeting reminders for this visit. They do not mark launch checks complete.</p>
              <button type="button" onClick={() => setReviewed([])} className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4">Reset ticks</button>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <PresentationSection slide={2}>
              <DiscussionTable headings={["Customer experience", "Amber’s management tools"]} rows={[
                ["Consultations and service requests", "Booking requests and service invoices"],
                ["Recipes and cooking-class pages", "Paid recipe previews and class registrations"],
                ["Member newsletter archive", "Newsletter Studio and email subscribers"],
              ]} />
              <p>Today’s review: confirm the workflows and agree on the remaining launch checks.</p>
              <div className="grid gap-4 sm:grid-cols-3">{[
                ["Website", "What customers see: services, requests, recipes, classes, and their member account."],
                ["Admin", "What Amber manages: enquiries, invoices, registrations, reviews, and newsletters."],
                ["Contentful", "What Amber edits: website wording, photography, recipes, and service content."],
              ].map(([title, description]) => <div key={title}><h3 className="font-semibold text-[#173d40]">{title}</h3><p className="mt-2">{description}</p></div>)}</div>
            </PresentationSection>

            <PresentationSection slide={3}>
              <p>Explore the customer journey and the tools behind it. Use the seven workflows below for the live demo, then continue with slide 4 to discuss recurring work.</p>
              <nav aria-label="Website workflows" className="flex flex-wrap gap-2">{stops.map((stop, index) => <a key={stop.id} href={`#${stop.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#edf4f2] px-3 py-2 text-sm font-medium text-[#245e60] hover:bg-[#dceae5]">{reviewed.includes(stop.id) && <Check aria-hidden="true" className="size-4" />}{index + 1}. {stop.title}</a>)}</nav>
            </PresentationSection>
            {stops.map((stop, index) => (
              <section key={stop.id} id={stop.id} aria-labelledby={`${stop.id}-title`} className="scroll-mt-6 rounded-2xl border border-[#d5e3df] bg-white p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#367577]">Slide 3 · Workflow {index + 1} · {stop.owner}</p>
                <h2 id={`${stop.id}-title`} className="mt-3 text-2xl font-semibold tracking-tight">{stop.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{stop.description}</p>
                <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
                  {stop.steps.map(step => <li key={step} className="pl-1">{step}</li>)}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2">
                  {stop.links.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#edf4f2] px-4 py-3 text-sm font-semibold text-[#245e60] transition-colors hover:bg-[#dceae5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#367577]">{link.label}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /><span className="sr-only"> (opens in a new tab)</span></a>)}
                </div>
                {stop.note && <p className="mt-5 rounded-xl border border-[#e9dfbd] bg-[#fcf9ef] p-4 text-sm leading-6 text-[#695523]">{stop.note}</p>}
                <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 border-t border-[#e2ebe7] pt-5 text-sm font-medium">
                  <input type="checkbox" checked={reviewed.includes(stop.id)} onChange={event => setReviewed(current => event.target.checked ? [...current, stop.id] : current.filter(id => id !== stop.id))} className="size-5 shrink-0 accent-[#388082]" />
                  We reviewed {stop.title.toLowerCase()}
                </label>
              </section>
            ))}
            <PresentationSection slide={4}>
              <DiscussionTable headings={["Recurring task", "What our support would handle"]} rows={[
                ["Keep recipes current", "Upload approved recipes and check the layout"],
                ["Promote services or classes", "Prepare graphics from approved details"],
                ["Prepare a newsletter", "Format supplied content and organize the archive"],
                ["Stay on top of inquiries", "Maintain a follow-up list and draft replies"],
              ]} />
              <p>You choose what to hand over and keep approval of your brand and customer commitments.</p>
            </PresentationSection>

            <PresentationSection slide={5}>
              <DiscussionTable headings={["Role", "Proposed responsibility"]} rows={[
                ["Zul", "Your point of contact for priorities, technical decisions, and final quality checks"],
                ["Developer", "Maintenance, troubleshooting, and small website improvements"],
                ["Designer", "Class flyers, social graphics, and newsletter artwork"],
                ["Assistant", "Recipe uploads, newsletter formatting, and draft replies"],
              ]} />
              <p>Access to several skills within an agreed monthly allowance. Zul coordinates the work. Amber approves public content, newsletter sends, customer pricing, and booking commitments.</p>
            </PresentationSection>

            <PresentationSection slide={6}>
              <DiscussionTable headings={["Amber provides", "The team prepares"]} rows={[
                ["A recipe, story, or class announcement", "A formatted newsletter draft"],
                ["Approved photos and event details", "Matching promotional graphics"],
                ["Final edits and approval", "The approved website or archive update"],
              ]} />
              <p>A useful starting project for the trial. We estimate the work first and agree what fits the monthly allowance. This is an example workflow, not a guaranteed monthly quantity.</p>
              <p>Publishing to the archive and emailing subscribers are separate actions. Amber approves publication and sending.</p>
              <a href="/admin/newsletters" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#367577] underline underline-offset-4">Open Newsletter Studio <ArrowUpRight aria-hidden="true" className="size-4" /><span className="sr-only"> (opens in a new tab)</span></a>
            </PresentationSection>

            <PresentationSection slide={7}>
              <ol className="list-decimal space-y-4 pl-5">
                <li><strong className="text-[#173d40]">Choose priorities.</strong> Amber shares approved materials and the most important tasks.</li>
                <li><strong className="text-[#173d40]">Confirm the plan.</strong> Zul checks the scope, time required, and delivery dates.</li>
                <li><strong className="text-[#173d40]">Prepare and review.</strong> The team completes drafts. Amber approves public content.</li>
                <li><strong className="text-[#173d40]">Report and adjust.</strong> We share completed work, time used, and the next priorities.</li>
              </ol>
            </PresentationSection>

            <PresentationSection slide={8}>
              <p className="rounded-xl border border-[#e9dfbd] bg-[#fcf9ef] p-4 text-[#695523]">Discussion figures. Final scope, staffing, and price confirmed in writing. These options are proposed and have not been accepted.</p>
              <DiscussionTable headings={["", "Website support", "Website + design + admin"]} rows={[
                ["Proposed monthly budget", "USD $300", "USD $650–750"],
                ["Monthly allowance", "5 total hours", "15 total hours"],
                ["Planned allocation", "Technical help and small updates", "5 technical / 8 design or admin / 2 coordination"],
                ["Best fit", "Amber runs routine content work", "Amber delegates regular content tasks"],
              ]} />
              <p>Paid monthly in advance. Meetings and revisions count toward the allowance. Unused hours expire monthly. Extra work needs approval. Provider fees are separate.</p>
            </PresentationSection>

            <PresentationSection slide={9}>
              <DiscussionTable headings={["Month", "Focus"]} rows={[
                ["Month 1: Set up the routine", "Choose two recurring tasks. Agree templates, access, and approvals."],
                ["Month 2: Use the workflow", "Complete the agreed priorities. Review time used and revision effort."],
                ["Month 3: Review the value", "Assess the help Amber used. Agree whether to continue or adjust."],
              ]} />
              <p>Success means useful work completed and less routine work left with Amber. Review the actual workload and Amber’s feedback during the trial.</p>
            </PresentationSection>

            <PresentationSection slide={10}>
              <DiscussionTable headings={["Complete the current project", "Agree optional support"]} rows={[
                ["Final booking and payment checks", "Recurring tasks and monthly capacity"],
                ["Amber’s content review", "Budget, approvals, and response times"],
                ["Approval for public launch", "A start date and review at three months"],
              ]} />
              <p className="font-semibold text-[#173d40]">Existing agreed corrections remain part of the current project.</p>
            </PresentationSection>

            <PresentationSection slide={11}>
              <p>Choose two recurring tasks you would like help with. We can build the first month around those priorities.</p>
              <p>Discuss the level of support and monthly budget that would be useful. Then confirm the selected tasks, scope, and start date in writing.</p>
              <div className="flex flex-wrap gap-4"><a href="#website-tour" className="inline-flex min-h-11 items-center font-semibold text-[#367577] underline underline-offset-4">Reopen the website walkthrough</a><a href="#support-options" className="inline-flex min-h-11 items-center font-semibold text-[#367577] underline underline-offset-4">Review support options</a></div>
            </PresentationSection>
          </div>
        </div>
      </div>
    </main>
  );
}
