import type { ReactNode } from "react";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

type ListBlock = {
  type: "ul" | "ol";
  items: string[];
};

type ParagraphBlock = {
  type: "paragraph" | "heading" | "quote";
  text: string;
  level?: number;
};

type Block = ParagraphBlock | ListBlock;

function parseInlineMarkdown(text: string): ReactNode[] {
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-black/5 px-1 py-0.5 text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      return (
        <a
          key={index}
          href={href}
          className="font-semibold text-[#00676E] underline underline-offset-4 hover:opacity-75"
        >
          {label}
        </a>
      );
    }

    return part;
  });
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: ListBlock | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    blocks.push(list);
    list = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(orderedMatch[1]);
      continue;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: quoteMatch[1] });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const headingClass =
            block.level === 1
              ? "text-3xl md:text-4xl"
              : block.level === 2
                ? "text-2xl md:text-3xl"
                : "text-xl md:text-2xl";

          const children = parseInlineMarkdown(block.text);

          if (block.level === 1) {
            return (
              <h2 key={index} className={`font-bebas leading-none text-black ${headingClass}`}>
                {children}
              </h2>
            );
          }

          if (block.level === 2) {
            return (
              <h3 key={index} className={`font-bebas leading-none text-black ${headingClass}`}>
                {children}
              </h3>
            );
          }

          return (
            <h4 key={index} className={`font-semibold leading-tight text-black ${headingClass}`}>
              {children}
            </h4>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-[#00676E] pl-5 text-lg font-medium leading-8 text-[#333]"
            >
              {parseInlineMarkdown(block.text)}
            </blockquote>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 text-lg leading-8 text-[#262626]">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={index} className="list-decimal space-y-2 pl-6 text-lg leading-8 text-[#262626]">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-lg leading-8 text-[#262626]">
              {parseInlineMarkdown(block.text)}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
