// Default: read-only plan. Applying preserves all existing events and the
// signing secret, and requires the new authenticated agreement route to exist.
import 'dotenv/config';
import Stripe from 'stripe';

const args = process.argv.slice(2);
const mode = args[args.indexOf('--mode') + 1];
if (!['live', 'test'].includes(mode)) throw new Error('Choose --mode live or --mode test. The default operation only prints a plan.');
const key = mode === 'live' ? process.env.secret_key_stripe : process.env.sandbox_secret_key_stripe;
if (!key || !key.startsWith(`sk_${mode}_`)) throw new Error(`The ${mode} Stripe key is not configured as expected.`);
const stripe = new Stripe(key, { apiVersion: '2024-06-20', timeout: 15000, maxNetworkRetries: 1 });
const target = 'https://www.waistlessfoods.com/api/stripe/webhook';
const required = ['invoice.created', 'invoice.updated', 'invoice.finalized', 'invoice.paid', 'invoice.voided', 'invoice.deleted', 'invoice.marked_uncollectible'];
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
if (endpoints.has_more) throw new Error('More than 100 endpoints exist. Select the intended endpoint manually before changing anything.');
const matches = endpoints.data.filter(endpoint => endpoint.url === target && endpoint.status === 'enabled');
if (matches.length !== 1) throw new Error(`Expected exactly one enabled ${mode} website webhook; found ${matches.length}. No settings changed.`);
const endpoint = matches[0];
const missing = endpoint.enabled_events.includes('*') ? [] : required.filter(event => !endpoint.enabled_events.includes(event));
const plan = { mode, target, apiVersionPreserved: endpoint.api_version, existingEvents: endpoint.enabled_events, addEvents: missing, applied: false };
if (args.includes('--apply') && missing.length) {
  const probe = await fetch('https://www.waistlessfoods.com/api/admin/service-agreements', { redirect: 'error', signal: AbortSignal.timeout(10000) });
  const body = await probe.json().catch(() => ({}));
  if (probe.status !== 401 || body.error !== 'Admin session required') throw new Error('The new protected agreement API is not deployed and ready. No Stripe settings changed.');
  const updated = await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: [...endpoint.enabled_events, ...missing] });
  if (!required.every(event => updated.enabled_events.includes(event) || updated.enabled_events.includes('*'))) throw new Error('Stripe did not confirm all required invoice events. Inspect the existing endpoint.');
  plan.applied = true;
}
console.log(JSON.stringify(plan, null, 2));
