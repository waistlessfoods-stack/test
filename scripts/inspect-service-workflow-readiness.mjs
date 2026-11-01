// Read-only configuration/schema audit. Never prints keys, customer rows,
// webhook signing secrets, or payment methods. --inspect-stripe lists endpoints.
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import pg from 'pg';
import Stripe from 'stripe';

const report = { inspectedAt: new Date().toISOString(), database: {}, stripe: {}, noMutations: true };
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const url = new URL(process.env.DATABASE_URL); url.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
await client.connect();
try {
  const result = await client.query("SELECT (SELECT count(*)::int FROM service_agreements) AS agreement_count, (SELECT count(*)::int FROM service_invoice_records) AS invoice_count");
  report.database = { tablesAvailable: true, agreements: result.rows[0].agreement_count, invoiceRecords: result.rows[0].invoice_count };
} finally { await client.end(); }
for (const [mode, key] of [['test', process.env.sandbox_secret_key_stripe], ['live', process.env.secret_key_stripe]]) {
  report.stripe[mode] = { keyConfigured: Boolean(key) };
  if (!process.argv.includes('--inspect-stripe') || !key) continue;
  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20', timeout: 15000, maxNetworkRetries: 1 });
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    report.stripe[mode].endpoints = endpoints.data.map(endpoint => ({
      url: endpoint.url, status: endpoint.status, apiVersion: endpoint.api_version,
      checkoutEvents: endpoint.enabled_events.includes('*') || endpoint.enabled_events.includes('checkout.session.completed'),
      invoicePaidEvent: endpoint.enabled_events.includes('*') || endpoint.enabled_events.includes('invoice.paid'),
      invoiceLifecycleEvents: endpoint.enabled_events.filter(event => event === '*' || event.startsWith('invoice.')),
    }));
    report.stripe[mode].moreEndpoints = endpoints.has_more;
  } catch (error) { report.stripe[mode].inspectionError = { type: error.type || error.name, status: error.statusCode || null }; }
}
await mkdir('docs/audit-screenshots/service-agreements-2026-11-01', { recursive: true });
await writeFile('docs/audit-screenshots/service-agreements-2026-11-01/readiness.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
