import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photo: text("photo"),
  phone: text("phone"),
  birthDate: text("birth_date"),
  bio: text("bio"),
  specialty: text("specialty"),
  instagram: text("instagram"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Barber = typeof barbersTable.$inferSelect;
