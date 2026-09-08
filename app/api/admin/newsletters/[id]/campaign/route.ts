import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { campaigns } from '@/lib/newsletter-campaign-store';
import { campaignConfig } from '@/lib/newsletter-campaigns';
import { newsletterAdminGuard, newsletterError, newsletterJson, privateHeaders } from '@/lib/newsletter-http';
import { NewsletterInputError, parsePositiveInteger } from '@/lib/newsletter-content';
import { createNewsletterUnsubscribeUrl } from '@/lib/newsletter-unsubscribe';
import { sendEmail } from '@/lib/email/mailer';
import NewsletterIssueEmail from '@/lib/email/templates/newsletter-issue-email';
import { isNewsletterAddressReady } from '@/lib/newsletter-address';

export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };
const config = () => campaignConfig(process.env);
async function state(id: number) {
  const settings = config();
  return { ...await campaigns.read(id), settings: { enabled: settings.enabled, addressConfigured: isNewsletterAddressReady(settings.mailingAddress), dailyLimit: settings.dailyLimit } };
}
export async function GET(request: NextRequest, context: Context) {
  const denied = newsletterAdminGuard(request); if (denied) return denied;
  try { return NextResponse.json(await state(parsePositiveInteger((await context.params).id)), { headers: privateHeaders }); }
  catch (error) { return newsletterError(error); }
}
export async function POST(request: NextRequest, context: Context) {
  const denied = newsletterAdminGuard(request); if (denied) return denied;
  try {
    const id = parsePositiveInteger((await context.params).id);
    const input = await newsletterJson(request);
    let message = '';
    let attempted = false;
    if (input.action === 'prepare') {
      await campaigns.prepare(id, parsePositiveInteger(input.version), config());
      message = 'Campaign and audience saved. No emails sent. Review the frozen content below.';
    } else if (input.action === 'send') {
      if (input.confirm !== 'SEND') throw new NewsletterInputError('Explicit send confirmation is required.');
      const result = await campaigns.sendNext(id, config(), async (campaign, delivery) => {
        // Never derive email links from an untrusted request Host header.
        const unsubscribeUrl = createNewsletterUnsubscribeUrl({ subscriberId: delivery.subscriber_id, email: delivery.email, siteUrl: 'https://www.waistlessfoods.com' });
        const oneClick = new URL(unsubscribeUrl);
        oneClick.pathname = '/api/newsletter/one-click';
        const mail = await sendEmail({
          to: delivery.email,
          subject: campaign.snapshot.subject,
          react: React.createElement(NewsletterIssueEmail, { issue: campaign.snapshot, campaign: { unsubscribeUrl, mailingAddress: campaign.mailing_address } }),
          headers: { 'List-Unsubscribe': `<${oneClick.href}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        });
        if (mail.error || !mail.data?.id) throw new Error('SMTP outcome uncertain');
        return mail.data.id;
      });
      message = result.message || ''; attempted = result.attempted;
    } else if (input.action === 'resume' || input.action === 'cancel') {
      await campaigns.control(id, input.action);
      message = input.action === 'resume' ? 'Pending recipients ready. Previously attempted recipients will not be retried.' : 'Pending recipients cancelled. An email already in flight cannot be recalled.';
    } else throw new NewsletterInputError('Unknown campaign action.');
    return NextResponse.json({ ...await state(id), message, attempted }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}
