import { requireAdminPageSession } from "@/lib/admin-page-session";
import ClassRosterAdmin from "@/components/admin/class-rosters";

export default async function Page() {
  await requireAdminPageSession();
  return <ClassRosterAdmin />;
}
