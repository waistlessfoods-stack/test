export async function POST(request: Request) {
  const bodyText = await request.text();
  const headers = new Headers(request.headers);

  let payload: Record<string, unknown> = {};
  if (bodyText) {
    try {
      payload = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!payload.tag && !payload.tags) {
    payload.tag = "header-settings";
  }

  return fetch(new URL("/api/revalidate/contentful", request.url), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}
