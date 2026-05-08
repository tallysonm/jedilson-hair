import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const blockedSlotsTable = pgTable("blocked_slots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time"),
  reason: text("reason"),
  allDay: boolean("all_day").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BlockedSlot = typeof blockedSlotsTable.$inferSelect;
export type InsertBlockedSlot = typeof blockedSlotsTable.$inferInsert;
