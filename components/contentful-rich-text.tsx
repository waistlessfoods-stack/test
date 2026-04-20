"use client";

import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, MARKS } from "@contentful/rich-text-types";

function getAssetUrl(asset: any): string | null {
  const url = asset?.fields?.file?.url;
  if (!url || typeof url !== "string") return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

type ContentfulRichTextProps = {
  /** The resolved Contentful rich text document from the CDA. */
  document: any;
  className?: string;
};

/**
 * Renders a Contentful Rich Text document with recipe-appropriate styling.
 * Supports embedded images, headings, paragraphs, and lists.
 */
export function ContentfulRichText({ document, className }: ContentfulRichTextProps) {
  if (!document) return null;

  const options = {
    renderMark: {
      [MARKS.BOLD]: (text: React.ReactNode) => (
        <strong className="font-semibold text-[#1a1a1a]">{text}</strong>
      ),
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_node: any, children: React.ReactNode) => {
        // Skip empty paragraphs (Contentful adds them as spacers)
        const isEmpty =
          Array.isArray(children) &&
          children.every(
            (c) => (typeof c === "string" && c.trim() === "") || c === null
          );
        if (isEmpty) return null;
        return (
          <p className="text-base md:text-lg leading-relaxed text-[#6F6F6F] mb-3">
            {children}
          </p>
        );
      },

      [BLOCKS.HEADING_2]: (_node: any, children: React.ReactNode) => (
        <h2 className="text-xl md:text-2xl font-semibold text-black mt-5 mb-2">
          {children}
        </h2>
      ),

      [BLOCKS.HEADING_3]: (_node: any, children: React.ReactNode) => (
        <h3 className="text-lg md:text-xl font-medium text-black mt-4 mb-1">
          {children}
        </h3>
      ),

      [BLOCKS.UL_LIST]: (_node: any, children: React.ReactNode) => (
        <ul className="space-y-2 text-base md:text-lg text-[#1F1F1F] mb-4">
          {children}
        </ul>
      ),

      [BLOCKS.OL_LIST]: (_node: any, children: React.ReactNode) => (
        <ol className="list-decimal pl-5 space-y-2 text-base md:text-lg text-[#1F1F1F] mb-4">
          {children}
        </ol>
      ),

      [BLOCKS.LIST_ITEM]: (_node: any, children: React.ReactNode) => (
        <li className="leading-relaxed [&>p]:mb-0 [&>p]:text-[#1F1F1F]">{children}</li>
      ),

      [BLOCKS.HR]: () => <hr className="border-t border-[#E5E5E5] my-4" />,

      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        const asset = node.data?.target;
        const url = getAssetUrl(asset);
        if (!url) return null;
        const alt = asset?.fields?.title || asset?.fields?.description || "";
        return (
          <div className="relative w-full aspect-[16/7] rounded-lg overflow-hidden bg-[#EFEFEF] my-5">
            <Image
              src={url}
              alt={alt}
              fill
              className="object-cover"
            />
          </div>
        );
      },
    },
  };

  return (
    <div className={className}>
      {documentToReactComponents(document, options as any)}
    </div>
  );
}
