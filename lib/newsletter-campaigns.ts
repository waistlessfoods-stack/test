import { assertNewsletterReady, NewsletterInputError, parseNewsletterContent, type NewsletterContent } from '@/lib/newsletter-content';
import { isNewsletterAddressReady } from '@/lib/newsletter-address';

type Value = string | number | boolean | null;
type Row = Record<string, unknown>;
export type Query = (statement: string, values?: Value[]) => Promise<Row[]>;
export type CampaignDatabase = { query: Query; transaction: <T>(work: (query: Query) => Promise<T>) => Promise<T> };
export type Campaign = { id: number; issue_id: number; issue_version: number; snapshot: NewsletterContent; mailing_address: string; status: string };
export type Delivery = { id: number; campaign_id: number; subscriber_id: number; email: string; status: string };
export type CampaignConfig = { enabled: boolean; mailingAddress: string; dailyLimit: number };

export function campaignConfig(env: Record<string, string | undefined>): CampaignConfig {
  const cap = Number(env.NEWSLETTER_DAILY_LIMIT || 100);
  const mailingAddress = env.NEWSLETTER_MAILING_ADDRESS?.trim() || '';
  return {
    enabled: isNewsletterAddressReady(mailingAddress) && env.NEWSLETTER_SENDING_ENABLED === 'true' && !!env.Email && !!env.AppPassword && (!env.VERCEL || env.VERCEL_ENV === 'production'),
    mailingAddress,
    dailyLimit: Number.isInteger(cap) && cap >= 1 && cap <= 100 ? cap : 100,
  };
}

// SMTP acceptance is NOT inbox delivery. An interrupted/failed attempt is never
// automatically retried: Google may already have accepted it before disconnection.
export function createCampaignService(database: CampaignDatabase) {
  async function read(issueId: number) {
    const [campaign] = await database.query('SELECT * FROM newsletter_campaigns WHERE issue_id=$1', [issueId]);
    if (!campaign) return { campaign: null, counts: {}, recent: [] };
    const counts = await database.query('SELECT status, count(*)::int AS count FROM newsletter_deliveries WHERE campaign_id=$1 GROUP BY status', [Number(campaign.id)]);
    const recent = await database.query("SELECT id, email, status, attempted_at FROM newsletter_deliveries WHERE campaign_id=$1 AND status IN ('uncertain','sending') ORDER BY id DESC LIMIT 20", [Number(campaign.id)]);
    return { campaign: campaign as unknown as Campaign, counts: Object.fromEntries(counts.map(row => [String(row.status), Number(row.count)])), recent };
  }

  async function prepare(issueId: number, version: number, config: CampaignConfig) {
    if (!isNewsletterAddressReady(config.mailingAddress)) throw new NewsletterInputError('Previews can use a placeholder. Add the business mailing address before freezing a subscriber campaign.');
    return database.transaction(async query => {
      // The issue lock makes repeated preparation idempotent, even across tabs.
      const [issue] = await query('SELECT * FROM newsletter_issues WHERE id=$1 FOR UPDATE', [issueId]);
      if (!issue) throw new NewsletterInputError('Issue not found.');
      const [existing] = await query('SELECT id FROM newsletter_campaigns WHERE issue_id=$1', [issueId]);
      if (existing) return Number(existing.id);
      if (issue.version !== version) throw new NewsletterInputError('Save or reload the latest issue before preparing.');
      const content = parseNewsletterContent({ ...issue, previewText: issue.preview_text, ctaLabel: issue.cta_label, ctaUrl: issue.cta_url });
      assertNewsletterReady(content);
      const [created] = await query('INSERT INTO newsletter_campaigns(issue_id,issue_version,snapshot,mailing_address) VALUES ($1,$2,$3::jsonb,$4) RETURNING id', [issueId, version, JSON.stringify(content), config.mailingAddress]);
      const id = Number(created.id);
      await query(`INSERT INTO newsletter_deliveries(campaign_id,subscriber_id,email)
        SELECT $1, min(id), lower(trim(email)) FROM subscribers
        WHERE active=true AND unsubscribed_at IS NULL GROUP BY lower(trim(email))`, [id]);
      await query("UPDATE newsletter_campaigns SET status='completed' WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM newsletter_deliveries WHERE campaign_id=$1)", [id]);
      return id;
    });
  }

  async function reserve(issueId: number, config: CampaignConfig) {
    if (!config.enabled) throw new NewsletterInputError('Subscriber sending is disabled. Configure and enable it in the production environment first.');
    return database.transaction(async query => {
      await query('SELECT id FROM newsletter_dispatch_lock WHERE id=1 FOR UPDATE');
      const [campaignRow] = await query('SELECT * FROM newsletter_campaigns WHERE issue_id=$1 FOR UPDATE', [issueId]);
      if (!campaignRow) throw new NewsletterInputError('Prepare and review the campaign first.');
      const campaign = campaignRow as unknown as Campaign;
      if (!isNewsletterAddressReady(campaign.mailing_address)) throw new NewsletterInputError('This campaign has a placeholder footer and cannot be sent.');
      // A terminated function may leave a claimed row. Never send it again.
      const stale = await query("UPDATE newsletter_deliveries SET status='uncertain' WHERE status='sending' AND attempted_at < now()-interval '2 minutes' RETURNING campaign_id");
      for (const row of stale) await query("UPDATE newsletter_campaigns SET status='paused' WHERE id=$1 AND status='ready'", [Number(row.campaign_id)]);
      if (stale.some(row => row.campaign_id === campaign.id)) return { message: 'An interrupted send needs review. Remaining recipients are paused.' };
      if (campaign.status !== 'ready') return { message: `Campaign is ${campaign.status}.` };
      const [lock] = await query('SELECT next_at > now() AS cooling, busy_until > now() AS busy FROM newsletter_dispatch_lock WHERE id=1');
      if (lock.busy || lock.cooling) return { message: 'Another send is running or cooling down. Wait 10 seconds and refresh.' };
      const [budget] = await query("SELECT count(*)::int AS used FROM newsletter_deliveries WHERE attempted_at > now()-interval '24 hours'");
      if (Number(budget.used) >= config.dailyLimit) return { message: 'Newsletter rolling 24-hour limit reached. Resume after earlier attempts leave the window.' };
      // Recheck consent and unchanged identity immediately before reservation.
      await query(`UPDATE newsletter_deliveries d SET status='skipped' WHERE campaign_id=$1 AND status='pending' AND NOT EXISTS
        (SELECT 1 FROM subscribers s WHERE s.id=d.subscriber_id AND lower(trim(s.email))=d.email AND s.active=true AND s.unsubscribed_at IS NULL)`, [campaign.id]);
      const [deliveryRow] = await query("SELECT * FROM newsletter_deliveries WHERE campaign_id=$1 AND status='pending' ORDER BY id LIMIT 1 FOR UPDATE", [campaign.id]);
      if (!deliveryRow) {
        await query("UPDATE newsletter_campaigns SET status='completed' WHERE id=$1", [campaign.id]);
        return { message: 'Campaign finished. No pending recipients remain.' };
      }
      const delivery = deliveryRow as unknown as Delivery;
      await query("UPDATE newsletter_deliveries SET status='sending', attempted_at=now() WHERE id=$1", [delivery.id]);
      await query("UPDATE newsletter_dispatch_lock SET next_at=now()+interval '10 seconds', busy_until=now()+interval '2 minutes' WHERE id=1");
      return { campaign, delivery };
    });
  }

  async function sendNext(issueId: number, config: CampaignConfig, send: (campaign: Campaign, delivery: Delivery) => Promise<string>) {
    const claim = await reserve(issueId, config);
    if (!('delivery' in claim) || !claim.delivery) return { ...claim, attempted: false };
    const { campaign, delivery } = claim;
    let messageId: string | null = null;
    try {
      // Recheck cancellation and opt-out after the claim, before SMTP.
      const [eligible] = await database.query(`SELECT d.id FROM newsletter_deliveries d JOIN subscribers s ON s.id=d.subscriber_id
        JOIN newsletter_campaigns c ON c.id=d.campaign_id WHERE d.id=$1 AND d.status='sending' AND c.status='ready'
        AND s.active=true AND s.unsubscribed_at IS NULL AND lower(trim(s.email))=d.email`, [delivery.id]);
      if (!eligible) {
        await database.transaction(async query => {
          await query("UPDATE newsletter_deliveries SET status='skipped' WHERE id=$1 AND status='sending'", [delivery.id]);
          await query('UPDATE newsletter_dispatch_lock SET busy_until=now() WHERE id=1');
        });
        return { message: 'Recipient skipped after a consent or campaign change.', attempted: true };
      }
      messageId = await send(campaign, delivery);
    } catch { /* Keep failure details out of API responses; outcome may be ambiguous. */ }
    await database.transaction(async query => {
      await query('SELECT id FROM newsletter_dispatch_lock WHERE id=1 FOR UPDATE');
      await query("UPDATE newsletter_deliveries SET status=$2, message_id=$3 WHERE id=$1 AND status='sending'", [delivery.id, messageId ? 'accepted' : 'uncertain', messageId]);
      if (!messageId) await query("UPDATE newsletter_campaigns SET status='paused' WHERE id=$1 AND status='ready'", [campaign.id]);
      else await query("UPDATE newsletter_campaigns SET status='completed' WHERE id=$1 AND status='ready' AND NOT EXISTS (SELECT 1 FROM newsletter_deliveries WHERE campaign_id=$1 AND status IN ('pending','sending'))", [campaign.id]);
      await query('UPDATE newsletter_dispatch_lock SET busy_until=now() WHERE id=1');
    });
    return { message: messageId ? 'Google accepted the email. Inbox delivery is not confirmed.' : 'Send outcome uncertain. Campaign paused; this recipient will not be retried.', attempted: true };
  }

  async function control(issueId: number, action: 'resume' | 'cancel') {
    await database.transaction(async query => {
      await query('SELECT id FROM newsletter_dispatch_lock WHERE id=1 FOR UPDATE');
      const [campaign] = await query('SELECT * FROM newsletter_campaigns WHERE issue_id=$1 FOR UPDATE', [issueId]);
      if (!campaign) throw new NewsletterInputError('Campaign not found.');
      if (action === 'resume') {
        await query("UPDATE newsletter_deliveries SET status='uncertain' WHERE campaign_id=$1 AND status='sending' AND attempted_at < now()-interval '2 minutes'", [Number(campaign.id)]);
        const inFlight = await query("SELECT id FROM newsletter_deliveries WHERE campaign_id=$1 AND status='sending'", [Number(campaign.id)]);
        if (inFlight.length) throw new NewsletterInputError('A send is still running. Wait two minutes before resuming.');
        if (campaign.status !== 'cancelled' && campaign.status !== 'completed') await query("UPDATE newsletter_campaigns SET status='ready' WHERE id=$1", [Number(campaign.id)]);
      } else {
        await query("UPDATE newsletter_campaigns SET status='cancelled' WHERE id=$1 AND status IN ('ready','paused')", [Number(campaign.id)]);
        await query("UPDATE newsletter_deliveries SET status='skipped' WHERE campaign_id=$1 AND status='pending'", [Number(campaign.id)]);
      }
    });
  }
  return { read, prepare, sendNext, control };
}
