import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  authUserId: uuid("auth_user_id").unique(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active"),
});

export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = typeof clientsTable.$inferInsert;