import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as https from "https";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Fix: Node.js native fetch (undici) fails with ETIMEDOUT when DNS returns
// mixed IPv4/IPv6 results and IPv6 has no route. Use https module with
// family:4 to force IPv4-only connections to Neon's HTTP API endpoint.
neonConfig.fetchFunction = (
  url: string,
  opts?: RequestInit
): Promise<Response> => {
  const parsed = new URL(url);
  const headers: Record<string, string> = {};
  if (opts?.headers) {
    if (opts.headers instanceof Headers) {
      (opts.headers as Headers).forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(opts.headers)) {
      (opts.headers as [string, string][]).forEach(([k, v]) => {
        headers[k] = v;
      });
    } else {
      Object.assign(headers, opts.headers);
    }
  }
  return new Promise((resolve, reject) => {
    const body = opts?.body;
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + (parsed.search || ""),
        method: opts?.method || "GET",
        headers,
        family: 4,
        timeout: 10000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          const status = res.statusCode ?? 200;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            headers: {
              get: (h: string) => {
                const val = res.headers[h.toLowerCase()];
                return Array.isArray(val) ? val.join(", ") : (val ?? null);
              },
            },
            text: () => Promise.resolve(text),
            json: () => Promise.resolve(JSON.parse(text)),
          } as unknown as Response);
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Neon DB connection timeout"));
    });
    if (body) req.write(body as string);
    req.end();
  });
};

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
