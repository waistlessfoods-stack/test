import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import type { Recipe } from '@/lib/contentful-management';
import { CheckoutError, checkoutSessionState, type CheckoutMode } from '@/lib/checkout-content';
import { buildStripeLineItemsFromSnapshot, isStoredOrderItems, resolveOrderCheckoutSnapshot, type OrderCheckoutSnapshot, type StoredOrderItem } from '@/lib/order-checkout-snapshot';
import { getCookingClassAvailabilityError } from '@/lib/cooking-class-capacity';

type Row = Record<string, unknown>;
export type CheckoutQuery = (sql: string, values?: (string | number | null)[]) => Promise<Row[]>;
export type CheckoutDatabase = { transaction: <T>(work: (query: CheckoutQuery) => Promise<T>) => Promise<T> };
type Context = { stripe: Stripe; mode: CheckoutMode; appUrl: string };
type NewCheckout = Context & { userId: string; email: string; snapshot: OrderCheckoutSnapshot };
type ResumeCheckout = Context & { orderId: number; ownerIds: string[]; catalogue: Recipe[]; classesEnabled: boolean };

function classes(items: StoredOrderItem[]) { return items.filter(item => item.kind === 'cooking_class'); }
function eventKey(item: StoredOrderItem) { return `${item.id}:${item.eventDate?.trim() || ''}`; }
function basketKey(items: StoredOrderItem[]) {
  return JSON.stringify(items.map(item => [item.id, item.kind, item.quantity, item.price, item.eventDate || '']).sort((a,b) => String(a[0]).localeCompare(String(b[0]))));
}
function metadata(row: Row): Record<string, unknown> { return row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {}; }

export function createShopCheckout(database: CheckoutDatabase) {
  async function locked(query: CheckoutQuery, mode: CheckoutMode, userId: string, items: StoredOrderItem[]) {
    // Every create/resume path takes the same class locks in a stable order.
    // Keep them until Stripe returns and the pending order is committed.
    const keys = [...new Set([`checkout-user:${mode}:${userId}`, ...classes(items).map(item => `checkout-class:${mode}:${eventKey(item)}`)])].sort();
    for (const key of keys) await query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
  }
  async function sessionFor(row: Row, context: Context): Promise<Stripe.Checkout.Session> {
    const id = String(row.stripe_session_id);
    if (metadata(row).expiredCheckoutSessionId === id) return { id, livemode: context.mode === 'live', status: 'expired', payment_status: 'unpaid' } as Stripe.Checkout.Session;
    let session: Stripe.Checkout.Session;
    try { session = await context.stripe.checkout.sessions.retrieve(id); }
    catch { throw new CheckoutError("An existing payment could not be checked. Refresh your orders and retry shortly; a second payment link has not been created.", 503); }
    if (session.id !== id) throw new CheckoutError("The payment status could not be confirmed. Please contact support.", 503);
    const state = checkoutSessionState(session, context.mode);
    if (state !== 'expired' && (session.amount_total !== Number(row.amount) || session.currency !== row.currency)) throw new CheckoutError("An existing checkout amount needs review. Please contact support.", 409);
    return session;
  }
  async function availability(query: CheckoutQuery, context: Context, userId: string, snapshot: OrderCheckoutSnapshot, excludeOrderId?: number) {
    const requested = classes(snapshot.items);
    const rows = await query(`SELECT * FROM orders WHERE status IN ('pending','completed') AND left(stripe_session_id,8)=$1 AND
      (user_id=$2 OR EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(items)='array' THEN items ELSE '[]'::jsonb END) line
       WHERE line->>'id' IN (SELECT jsonb_array_elements_text($3::jsonb)))) ORDER BY id`, [`cs_${context.mode}_`, userId, JSON.stringify(requested.map(item => item.id))]);
    const relevant = rows.filter(row => row.status === 'pending' && Number(row.id) !== excludeOrderId && (
      (row.user_id === userId && isStoredOrderItems(row.items) && basketKey(row.items) === basketKey(snapshot.items) && Number(row.amount) === snapshot.totalCents) ||
      (Array.isArray(row.items) && row.items.some(line => line && typeof line === 'object' && requested.some(item => item.id === line.id && (!line.eventDate || line.eventDate.trim() === item.eventDate?.trim()))))
    ));
    if (relevant.filter(row => metadata(row).expiredCheckoutSessionId !== row.stripe_session_id).length > 30) throw new CheckoutError("Several class checkouts are being verified. Please retry shortly.", 503);
    const sessions = new Map(await Promise.all(relevant.map(async row => [Number(row.id), await sessionFor(row, context)] as const)));
    let reusable: Stripe.Checkout.Session | undefined;
    for (const row of relevant) {
      const session = sessions.get(Number(row.id))!;
      const state = checkoutSessionState(session, context.mode);
      if (state === 'expired') {
        await query("UPDATE orders SET metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('expiredCheckoutSessionId',$2::text) WHERE id=$1 AND stripe_session_id=$2", [Number(row.id), session.id]);
      }
      if (row.user_id === userId && isStoredOrderItems(row.items) && basketKey(row.items) === basketKey(snapshot.items) && Number(row.amount) === snapshot.totalCents) {
        if (state === 'paid' || state === 'processing') throw new CheckoutError("This checkout has already been submitted. Refresh My Orders to check its payment status.", 409);
        if (state === 'open') reusable = session;
      }
    }
    // Reusing a valid existing link does not reserve any additional seats.
    if (reusable) {
      if (excludeOrderId !== undefined) throw new CheckoutError('Another matching checkout is already open. Continue that order in My Orders.', 409);
      return reusable;
    }
    for (const item of requested) {
      let held = 0;
      for (const row of rows) {
        if (Number(row.id) === excludeOrderId || !Array.isArray(row.items)) continue;
        if (row.status === 'pending') {
          const session = sessions.get(Number(row.id));
          if (!session || checkoutSessionState(session, context.mode) === 'expired') continue;
        }
        for (const line of row.items) {
          if (!line || typeof line !== 'object' || line.id !== item.id || (line.eventDate && line.eventDate.trim() !== item.eventDate?.trim())) continue;
          if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) throw new CheckoutError("Class availability needs an administrator review. Please contact support.", 409);
          held += line.quantity;
        }
      }
      const error = getCookingClassAvailabilityError({ title: item.name, capacity: item.capacity!, soldQuantity: held, requestedQuantity: item.quantity });
      if (error) throw new CheckoutError(error, 409);
    }
    return undefined;
  }
  async function createSession(context: Context, snapshot: OrderCheckoutSnapshot, email: string, userId: string, orderId?: number) {
    const session = await context.stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'],
      line_items: buildStripeLineItemsFromSnapshot(snapshot), customer_email: email,
      ...(classes(snapshot.items).length ? { expires_at: Math.floor(Date.now()/1000) + 31*60 } : {}),
      metadata: { userId, ...(orderId ? { orderId: String(orderId) } : {}), subtotalCents: String(snapshot.subtotalCents), taxCents: String(snapshot.taxCents) },
      success_url: `${context.appUrl}/orders?success=1&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${context.appUrl}/orders?resume=1`,
    }, { idempotencyKey: `wlf-checkout-${randomUUID()}` });
    try {
      if (checkoutSessionState(session, context.mode) !== 'open' || session.amount_total !== snapshot.totalCents || session.currency !== snapshot.currency) throw new CheckoutError("The checkout could not be confirmed. Please retry shortly.", 503);
    } catch (error) {
      if (session.status === 'open') { try { await context.stripe.checkout.sessions.expire(session.id); } catch { /* No URL returned. */ } }
      throw error;
    }
    return session;
  }
  async function cleanup(context: Context, session: Stripe.Checkout.Session | undefined) {
    if (session?.status === 'open') { try { await context.stripe.checkout.sessions.expire(session.id); } catch { /* No payment URL was returned. Keep Stripe's normal expiry. */ } }
  }
  async function create(input: NewCheckout) {
    let created: Stripe.Checkout.Session | undefined;
    try {
      return await database.transaction(async query => {
        await locked(query, input.mode, input.userId, input.snapshot.items);
        const existing = await availability(query, input, input.userId, input.snapshot);
        if (existing) return { url: existing.url!, reused: true };
        created = await createSession(input, input.snapshot, input.email, input.userId);
        await query(`INSERT INTO orders(user_id,stripe_session_id,status,amount,currency,items,customer_email,metadata)
          VALUES ($1,$2,'pending',$3,$4,$5::jsonb,$6,$7::jsonb)`, [input.userId, created.id, input.snapshot.totalCents, input.snapshot.currency, JSON.stringify(input.snapshot.items), input.email, JSON.stringify({ sessionUrl: created.url, checkoutSnapshot: input.snapshot, checkoutExpiresAt: created.expires_at })]);
        return { url: created.url!, reused: false };
      });
    } catch (error) { await cleanup(input, created); throw error; }
  }
  async function resume(input: ResumeCheckout) {
    let created: Stripe.Checkout.Session | undefined;
    try {
      return await database.transaction(async query => {
        const [initial] = await query('SELECT * FROM orders WHERE id=$1 AND user_id IN (SELECT jsonb_array_elements_text($2::jsonb))', [input.orderId, JSON.stringify(input.ownerIds)]);
        if (!initial) throw new CheckoutError('Order not found.', 404);
        const snapshot = resolveOrderCheckoutSnapshot({ amount: Number(initial.amount), currency: String(initial.currency), items: initial.items, metadata: initial.metadata });
        if (!snapshot) throw new CheckoutError('Order checkout data is invalid. Please contact support.');
        // Older order snapshots may predate explicit product kinds. Never let a
        // class resume through the unrestricted recipe path or guess its date.
        for (const item of snapshot.items) {
          const published = input.catalogue.find(recipe => recipe.id === item.id);
          if (item.kind === undefined && (published?.productKind === 'cooking_class' || item.capacity !== undefined || item.eventDate !== undefined)) item.kind = 'cooking_class';
          if (item.kind === 'cooking_class' && !item.eventDate?.trim()) throw new CheckoutError('This older class order needs its booked date reviewed. Please contact support.', 409);
        }
        await locked(query, input.mode, String(initial.user_id), snapshot.items);
        const [row] = await query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [input.orderId]);
        if (!row || row.status !== 'pending') throw new CheckoutError('Only pending orders can be paid.', 409);
        if (!String(row.stripe_session_id).startsWith(`cs_${input.mode}_`)) throw new CheckoutError('This order belongs to another payment environment.', 409);
        const session = await sessionFor(row, input);
        const state = checkoutSessionState(session, input.mode);
        if (state === 'paid' || state === 'processing') throw new CheckoutError('This checkout has already been submitted. Refresh My Orders to check its payment status.', 409);
        for (const item of classes(snapshot.items)) {
          const current = input.catalogue.find(recipe => recipe.id === item.id && recipe.productKind === 'cooking_class');
          if (!input.classesEnabled || !current || current.eventDate?.trim() !== item.eventDate?.trim() || !Number.isSafeInteger(current.capacity) || Number(current.capacity) < 1) {
            if (state === 'open') await input.stripe.checkout.sessions.expire(session.id);
            throw new CheckoutError('This class is no longer available on the booked date. Please choose a current class.', 409);
          }
          item.capacity = current.capacity;
        }
        if (state === 'open') return { url: session.url!, reused: true };
        await availability(query, input, String(row.user_id), snapshot, input.orderId);
        created = await createSession(input, snapshot, String(row.customer_email), String(row.user_id), input.orderId);
        await query(`UPDATE orders SET stripe_session_id=$2, updated_at=now(), metadata=coalesce(metadata,'{}'::jsonb)||$3::jsonb WHERE id=$1`, [input.orderId, created.id, JSON.stringify({ checkoutSnapshot: snapshot, previousStripeSessionId: row.stripe_session_id, sessionUrl: created.url, checkoutExpiresAt: created.expires_at, resumedAt: new Date().toISOString() })]);
        return { url: created.url!, reused: false };
      });
    } catch (error) { await cleanup(input, created); throw error; }
  }
  return { create, resume };
}
