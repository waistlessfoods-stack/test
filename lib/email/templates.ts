// Email template generators for different use cases

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
