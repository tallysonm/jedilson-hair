import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photo: text("photo"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Barber = typeof barbersTable.$inferSelect;
