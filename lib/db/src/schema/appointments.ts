import { pgTable, serial, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  servicePrice: numeric("service_price", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull().default("pending"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceType: text("recurrence_type"),
  recurrenceGroupId: text("recurrence_group_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
