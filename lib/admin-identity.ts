type AccountIdentity = {
  emailAddresses: { emailAddress: string; verification: { status: string } | null }[];
};

// Confirmed by Amber's October 31 written recap. Keep the authorization identity
// separate from ADMIN_EMAIL, which is used for operational email recipients.
export function administratorAccountEmail(): string {
  return (process.env.ADMIN_ACCOUNT_EMAIL || "admin@waistlessfoods.com").trim().toLowerCase();
}
export function isAuthorizedAdminAccount(user: AccountIdentity | null): boolean {
  const allowedEmail = administratorAccountEmail();
  return Boolean(user?.emailAddresses.some(email =>
    email.verification?.status === "verified" &&
    email.emailAddress.trim().toLowerCase() === allowedEmail
  ));
}
