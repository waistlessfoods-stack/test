import Image from "next/image";
import type { ReactNode } from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, MARKS, type Document } from "@contentful/rich-text-types";

type BlogRichTextProps = {
  document: Document;
  variant?: "article" | "callout";
};

function getAssetUrl(asset: unknown): string | null {
  const resolvedAsset = asset as
    | { fields?: { file?: { url?: unknown } } }
    | undefined;
  const url = resolvedAsset?.fields?.file?.url;

  if (!url || typeof url !== "string") return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

export function BlogRichText({
  document,
  variant = "article",
}: BlogRichTextProps) {
  const isCallout = variant === "callout";

  return documentToReactComponents(document, {
    renderMark: {
      [MARKS.BOLD]: (text: ReactNode) => (
        <strong className="font-bold text-current">{text}</strong>
      ),
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_node, children: ReactNode) => (
        <p
          className={
            isCallout
              ? "mb-3 text-base leading-7 text-[#173b39] last:mb-0 md:text-[17px]"
              : "mb-6 text-base leading-8 text-[#343434] last:mb-0 md:text-lg"
          }
        >
          {children}
        </p>
      ),
      [BLOCKS.HEADING_2]: (_node, children: ReactNode) => (
        <h2 className="mb-5 mt-12 font-bebas text-4xl font-bold leading-none text-black first:mt-0 md:text-5xl">
          {children}
        </h2>
      ),
      [BLOCKS.HEADING_3]: (_node, children: ReactNode) => (
        <h3 className="mb-4 mt-9 text-2xl font-bold leading-tight text-black md:text-3xl">
          {children}
        </h3>
      ),
      [BLOCKS.UL_LIST]: (_node, children: ReactNode) => (
        <ul className="mb-6 list-disc space-y-3 pl-6 text-base leading-7 text-[#343434] md:text-lg">
          {children}
        </ul>
      ),
      [BLOCKS.OL_LIST]: (_node, children: ReactNode) => (
        <ol className="mb-6 list-decimal space-y-3 pl-6 text-base leading-7 text-[#343434] md:text-lg">
          {children}
        </ol>
      ),
      [BLOCKS.LIST_ITEM]: (_node, children: ReactNode) => (
        <li className="pl-1 marker:font-bold marker:text-[#238d91] [&>p]:mb-0 [&>p]:inline [&>p]:text-current">
          {children}
        </li>
      ),
      [BLOCKS.QUOTE]: (_node, children: ReactNode) => (
        <blockquote className="my-8 border-l-4 border-[#35bfc4] bg-[#effafa] px-6 py-5 font-medium text-[#173b39] [&>p]:mb-0 [&>p]:text-current">
          {children}
        </blockquote>
      ),
      [BLOCKS.HR]: () => <hr className="my-10 border-[#d7e6e3]" />,
      [BLOCKS.TABLE]: (_node, children: ReactNode) => (
        <div
          className="mb-10 overflow-x-auto rounded-xl border border-[#d8d2c3] shadow-[0_16px_34px_-30px_rgba(0,0,0,0.35)]"
          role="region"
          aria-label="Storage guide table"
          tabIndex={0}
        >
          <p className="border-b border-[#d8d2c3] bg-[#dff3f1] px-4 py-2 text-xs font-bold text-black md:hidden">
            Swipe sideways to see all columns.
          </p>
          <table className="w-full min-w-[760px] border-collapse bg-white text-left">
            <tbody>{children}</tbody>
          </table>
        </div>
      ),
      [BLOCKS.TABLE_ROW]: (_node, children: ReactNode) => (
        <tr className="border-b border-[#ded8ca] bg-white last:border-b-0 even:bg-[#f7f1e6]">
          {children}
        </tr>
      ),
      [BLOCKS.TABLE_HEADER_CELL]: (_node, children: ReactNode) => (
        <th className="bg-[#dff3f1] px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-black first:w-[20%] [&:nth-child(2)]:w-[25%] [&>p]:mb-0 [&>p]:text-sm [&>p]:font-bold [&>p]:leading-5 [&>p]:text-black">
          {children}
        </th>
      ),
      [BLOCKS.TABLE_CELL]: (_node, children: ReactNode) => (
        <td className="align-top px-5 py-4 text-sm leading-6 text-[#343434] first:font-bold first:text-black [&>p]:mb-0 [&>p]:text-sm [&>p]:leading-6 [&>p]:text-current">
          {children}
        </td>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const target = node.data?.target as
          | {
              fields?: {
                file?: { url?: unknown };
                title?: unknown;
                description?: unknown;
              };
            }
          | undefined;
        const url = getAssetUrl(target);
        if (!url) return null;

        const alt = String(
          target?.fields?.description ?? target?.fields?.title ?? ""
        );

        return (
          <figure className="relative my-10 aspect-[16/9] overflow-hidden rounded-xl bg-[#eef2ef]">
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
            />
          </figure>
        );
      },
    },
  });
}
