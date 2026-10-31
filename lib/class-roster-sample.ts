import { buildClassRosters } from "@/lib/class-roster";

// Deliberately separate from database orders. No checkout, seats, or mail exist.
export function sampleClassRoster() {
  return buildClassRosters([{
    id: 900001,
    status: "completed",
    stripeSessionId: "cs_test_walkthrough_sample",
    items: [{ id: "sample-pasta-workshop", name: "SAMPLE - Fresh Pasta Workshop", kind: "cooking_class", eventDate: "December 12, 2026 - 10:00 AM CT (sample)", capacity: 12, quantity: 2, price: 75 }],
    customerEmail: "alex@example.com",
    metadata: { customerDetails: { name: "Alex Sample", phone: "" } },
    createdAt: new Date("2026-10-31T00:00:00Z"),
  }], "test");
}
