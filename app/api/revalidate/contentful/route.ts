import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  CONTENTFUL_TAGS,
  getTagsForContentType,
  isContentfulTag,
  normalizeRequestedPaths,
  normalizeRequestedTags,
} from "@/lib/contentful-revalidation";

type ContentfulWebhookBody = {
  secret?: string;
  tag?: string;
  tags?: unknown;
  path?: string;
  paths?: unknown;
  contentType?: string;
  sys?: {
    contentType?: {
      sys?: {
        id?: string;
      };
    };
  };
};

function getConfiguredSecret(): string | null {
  return process.env.CONTENTFUL_REVALIDATE_SECRET ?? null;
}

function getContentTypeId(body: ContentfulWebhookBody): string | null {
  if (typeof body.contentType === "string" && body.contentType.length > 0) {
    return body.contentType;
  }

  const nestedId = body.sys?.contentType?.sys?.id;
  return typeof nestedId === "string" && nestedId.length > 0 ? nestedId : null;
}

export async function POST(request: Request) {
  const configuredSecret = getConfiguredSecret();

  if (!configuredSecret) {
    return NextResponse.json(
      { error: "Missing CONTENTFUL_REVALIDATE_SECRET on server." },
      { status: 500 }
    );
  }

  let body: ContentfulWebhookBody = {};
  try {
    body = await request.json();
  } catch {
    // Allow empty JSON body when secret is sent in headers.
  }

  const providedSecret =
    request.headers.get("x-revalidate-secret") ||
    request.headers.get("x-contentful-secret") ||
    body.secret;

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const tags = new Set<typeof CONTENTFUL_TAGS[number]>();
  const paths = new Set<string>();

  if (typeof body.tag === "string" && isContentfulTag(body.tag)) {
    tags.add(body.tag);
  }

  for (const tag of normalizeRequestedTags(body.tags)) {
    tags.add(tag);
  }

  if (typeof body.path === "string" && body.path.startsWith("/")) {
    paths.add(body.path);
  }

  for (const path of normalizeRequestedPaths(body.paths)) {
    paths.add(path);
  }

  const contentTypeId = getContentTypeId(body);
  if (contentTypeId) {
    for (const tag of getTagsForContentType(contentTypeId)) {
      tags.add(tag);
    }
  }

  if (tags.size === 0 && paths.size === 0) {
    return NextResponse.json(
      {
        error: "No valid tags or paths to revalidate.",
        supportedTags: CONTENTFUL_TAGS,
      },
      { status: 400 }
    );
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tags: [...tags],
    paths: [...paths],
    contentType: contentTypeId,
    now: Date.now(),
  });
}
