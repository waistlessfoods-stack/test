import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'private_chef', 'cooking_class', 'blog'
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
