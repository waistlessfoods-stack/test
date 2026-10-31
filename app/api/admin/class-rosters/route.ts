import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { classRosterCsv, ClassRosterError, filterRegistrations, parseRosterQuery } from "@/lib/class-roster";
import { readClassRosters } from "@/lib/class-roster-data";
import { sampleClassRoster } from "@/lib/class-roster-sample";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" };
export const maxDuration = 30;
export async function GET(request: NextRequest) {
  const denied = requireAdminSession(request);
  if (denied) return denied;
  try {
    const query = parseRosterQuery(request.nextUrl.searchParams);
    const sample = request.nextUrl.searchParams.get("sample") === "1";
    if (sample && query.mode !== "test") throw new ClassRosterError("Sample registrations are available only in test mode.");
    const data = sample ? sampleClassRoster() : await readClassRosters(query.mode);
    if (query.format !== "csv") return NextResponse.json(data, { headers });
    if (!query.key) throw new ClassRosterError("Select a class before exporting.");
    const group = data.classes.find(group => group.key === query.key);
    if (!group) throw new ClassRosterError("Class not found in the selected order mode.", 404);
    return new NextResponse(classRosterCsv(group, filterRegistrations(group.registrations, query.status, query.query), query.mode), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="class-roster-${sample ? "sample" : query.mode}-${query.key.slice(0, 12)}-${query.status}.csv"` } });
  } catch (error) {
    if (error instanceof ClassRosterError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    console.error("Class roster read failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Could not load class registrations. Please retry." }, { status: 503, headers });
  }
}
