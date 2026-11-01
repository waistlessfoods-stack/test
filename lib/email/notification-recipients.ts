// Customer inquiries belong in the public business inbox, independently of the
// account used to administer the site or authenticate the outgoing mail server.
export const businessInquiryEmail = "info@waistlessfoods.com";

// Paid shop orders and public-class purchases use the same owner-confirmed
// business inbox, independently of the legacy ADMIN_EMAIL or SMTP sender.
export const businessOrderEmail = businessInquiryEmail;
