// Email template generators for different use cases

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOptionalValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : "Not provided";
}

function formatEnquiryType(type: string): string {
  return type
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function orderConfirmationTemplate({
  customerName,
  orderNumber,
  orderTotal,
  items,
  orderDate,
}: {
  customerName: string;
  orderNumber: string;
  orderTotal: string;
  items: Array<{ name: string; price: string; quantity: number }>;
  orderDate: string;
}) {
  const itemsList = items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">x${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${item.price}</td>
    </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0F8DAB; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { margin: 20px 0; }
          .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Thank you for your order! We're excited to prepare your premium recipes.</p>
            
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            
            <h3>Items Ordered</h3>
            <table class="order-table">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 12px; text-align: left;">Item</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            
            <div style="text-align: right; font-size: 18px; font-weight: bold;">
              Total: <span style="color: #0F8DAB;">${orderTotal}</span>
            </div>
            
            <p style="margin-top: 30px;">We'll send you a tracking update as soon as your order ships.</p>
            <p>If you have any questions, feel free to reach out!</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function welcomeEmailTemplate({ name }: { name: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0F8DAB; color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .content { margin: 20px 0; }
          .cta-button {
            display: inline-block;
            background: #0F8DAB;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Waistless Foods!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            <p>We're thrilled to have you join our food community! Your account has been successfully created.</p>
            
            <h2>What's Next?</h2>
            <ul>
              <li>Explore our recipe gallery</li>
              <li>Purchase premium recipes</li>
              <li>Get personalized food recommendations</li>
              <li>Track your orders</li>
            </ul>
            
            <a href="https://waitslessfood.com/recipes" class="cta-button">Browse Recipes</a>
            
            <p>If you have any questions or need help, our support team is here for you.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function passwordResetTemplate({
  name,
  resetLink,
}: {
  name: string;
  resetLink: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0F8DAB; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { margin: 20px 0; }
          .cta-button {
            display: inline-block;
            background: #0F8DAB;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            
            <a href="${resetLink}" class="cta-button">Reset Password</a>
            
            <p style="color: #666;">Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
            
            <div class="warning">
              <strong>⚠️ Security Note:</strong> This link expires in 24 hours. If you didn't request this, please ignore this email or contact support.
            </div>
            
            <p>For security reasons, we'll never ask for your password via email.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function bookingConfirmationTemplate({
  firstName,
  serviceTitle,
  preferredDate,
  alternativeDate,
  guests,
  notes,
}: {
  firstName: string;
  serviceTitle: string;
  preferredDate: string;
  alternativeDate?: string | null;
  guests: number;
  notes: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #388082; color: white; padding: 28px 30px; border-radius: 8px; text-align: center; }
          .content { margin: 24px 0; }
          .detail-box { background: #f4f4f4; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; }
          .detail-label { font-weight: bold; min-width: 160px; color: #555; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:22px;">Service Request Received</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(firstName)},</p>
            <p>Thank you for your request for <strong>${escapeHtml(serviceTitle)}</strong>. We've received your details and will be in touch shortly with availability and next steps. Your event is not confirmed until the required agreement and payment are complete.</p>
            <div class="detail-box">
              <div class="detail-row"><span class="detail-label">Service:</span> ${escapeHtml(serviceTitle)}</div>
              <div class="detail-row"><span class="detail-label">Preferred Date:</span> ${escapeHtml(preferredDate)}</div>
              ${alternativeDate ? `<div class="detail-row"><span class="detail-label">Alternative Date:</span> ${escapeHtml(alternativeDate)}</div>` : ""}
              <div class="detail-row"><span class="detail-label">Number of Guests:</span> ${guests}</div>
              <div class="detail-row"><span class="detail-label">Details:</span> ${escapeHtml(notes).replaceAll("\n", "<br />")}</div>
            </div>
            <p>If you have any questions in the meantime, feel free to reply to this email.</p>
            <p>We look forward to cooking for you!</p>
          </div>
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function bookingNotificationTemplate({
  firstName,
  lastName,
  email,
  phone,
  serviceTitle,
  preferredDate,
  alternativeDate,
  guests,
  notes,
  bookingId,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceTitle: string;
  preferredDate: string;
  alternativeDate?: string | null;
  guests: number;
  notes: string;
  bookingId: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #388082; color: white; padding: 28px 30px; border-radius: 8px; }
          .detail-box { background: #f4f4f4; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; }
          .detail-label { font-weight: bold; color: #555; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:20px; color:white;">New Service Request #${bookingId}</h1>
          </div>
          <div class="detail-box" style="margin-top:24px;">
            <h3 style="margin-top:0;">Customer Details</h3>
            <div class="detail-row"><span class="detail-label">Name:</span> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</div>
            <div class="detail-row"><span class="detail-label">Email:</span> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
            <div class="detail-row"><span class="detail-label">Phone:</span> ${escapeHtml(phone)}</div>
          </div>
          <div class="detail-box">
            <h3 style="margin-top:0;">Event Details</h3>
            <div class="detail-row"><span class="detail-label">Service:</span> ${escapeHtml(serviceTitle)}</div>
            <div class="detail-row"><span class="detail-label">Preferred Date:</span> ${escapeHtml(preferredDate)}</div>
            ${alternativeDate ? `<div class="detail-row"><span class="detail-label">Alternative Date:</span> ${escapeHtml(alternativeDate)}</div>` : ""}
            <div class="detail-row"><span class="detail-label">Guests:</span> ${guests}</div>
            <div class="detail-row"><span class="detail-label">Details:</span> ${escapeHtml(notes).replaceAll("\n", "<br />")}</div>
          </div>
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function enquiryConfirmationTemplate({
  name,
  type,
  message,
}: {
  name: string;
  type: string;
  message?: string | null;
}) {
  const enquiryLabel = formatEnquiryType(type);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #388082; color: white; padding: 28px 30px; border-radius: 8px; text-align: center; }
          .content { margin: 24px 0; }
          .detail-box { background: #f4f4f4; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; }
          .detail-label { font-weight: bold; color: #555; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:22px;">Enquiry Received</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            <p>Thank you for reaching out to WaistLess Foods. We've received your ${escapeHtml(enquiryLabel.toLowerCase())} enquiry and will be in touch shortly.</p>
            <div class="detail-box">
              <div class="detail-row"><span class="detail-label">Enquiry Type:</span> ${escapeHtml(enquiryLabel)}</div>
              <div class="detail-row"><span class="detail-label">Message:</span> ${formatOptionalValue(message)}</div>
            </div>
            <p>If you have more details to share, you can reply directly to this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function enquiryNotificationTemplate({
  name,
  email,
  phone,
  type,
  message,
  enquiryId,
}: {
  name: string;
  email: string;
  phone?: string | null;
  type: string;
  message?: string | null;
  enquiryId: number;
}) {
  const enquiryLabel = formatEnquiryType(type);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #388082; color: white; padding: 28px 30px; border-radius: 8px; }
          .detail-box { background: #f4f4f4; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; }
          .detail-label { font-weight: bold; color: #555; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:20px; color:white;">New Enquiry #${enquiryId}</h1>
          </div>
          <div class="detail-box" style="margin-top:24px;">
            <h3 style="margin-top:0;">Contact Details</h3>
            <div class="detail-row"><span class="detail-label">Name:</span> ${escapeHtml(name)}</div>
            <div class="detail-row"><span class="detail-label">Email:</span> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
            <div class="detail-row"><span class="detail-label">Phone:</span> ${formatOptionalValue(phone)}</div>
          </div>
          <div class="detail-box">
            <h3 style="margin-top:0;">Enquiry Details</h3>
            <div class="detail-row"><span class="detail-label">Type:</span> ${escapeHtml(enquiryLabel)}</div>
            <div class="detail-row"><span class="detail-label">Message:</span> ${formatOptionalValue(message)}</div>
          </div>
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function newsletterConfirmationTemplate({ email }: { email: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #388082; color: white; padding: 28px 30px; border-radius: 8px; text-align: center; }
          .content { margin: 24px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:22px;">You're on the list</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Thanks for subscribing to WaistLess Foods. We'll send recipes, chef tips, updates, and sustainable cooking inspiration to ${escapeHtml(email)}.</p>
            <p>We're glad you're here.</p>
          </div>
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function newsletterNotificationTemplate({
  email,
  subscriberId,
}: {
  email: string;
  subscriberId: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #388082; color: white; padding: 28px 30px; border-radius: 8px; }
          .detail-box { background: #f4f4f4; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; }
          .detail-label { font-weight: bold; color: #555; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:20px; color:white;">New Newsletter Subscriber #${subscriberId}</h1>
          </div>
          <div class="detail-box" style="margin-top:24px;">
            <div class="detail-row"><span class="detail-label">Email:</span> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
          </div>
          <div class="footer">
            <p>© 2026 Waistless Foods. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
