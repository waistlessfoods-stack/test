// Only ordinary contact fields are used. No private/custom metadata is exposed.
type ContactUser = {
  firstName?: string | null; lastName?: string | null;
  primaryEmailAddressId?: string | null;
  emailAddresses?: { id: string; emailAddress: string; verification?: { status?: string | null } | null }[];
  primaryPhoneNumberId?: string | null;
  phoneNumbers?: { id: string; phoneNumber: string }[];
};
export function clerkContactProfile(user: ContactUser | null | undefined) {
  if (!user) return null;
  const primary = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId);
  const firstName = user.firstName?.trim().slice(0, 100) || "";
  const lastName = user.lastName?.trim().slice(0, 100) || "";
  return { firstName, lastName, name: [firstName, lastName].filter(Boolean).join(" ").slice(0, 100),
    email: primary?.emailAddress.trim().toLowerCase() || "", emailVerified: primary?.verification?.status === "verified",
    phone: user.phoneNumbers?.find(phone => phone.id === user.primaryPhoneNumberId)?.phoneNumber.slice(0, 40) || "" };
}
export function agreementSignerName(user: ContactUser | null | undefined, recipient: { email: string; name: string }) {
  const profile = clerkContactProfile(user);
  return profile?.emailVerified && profile.email === recipient.email.trim().toLowerCase() && profile.name ? profile.name : recipient.name;
}
