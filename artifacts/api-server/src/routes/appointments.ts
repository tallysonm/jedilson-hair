import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  CreateAppointmentBody,
  UpdateAppointmentBody,
  UpdateAppointmentParams,
  GetAppointmentParams,
  DeleteAppointmentParams,
  GetAvailableSlotsQueryParams,
} from "@workspace/api-zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { SERVICES } from "./services";

const router = Router();

function getDateRange(period: string) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (period === "day") {
    return { start: today, end: today };
  } else if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  } else if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  return null;
}

const BUFFER_MINUTES = 10;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function generateTimeSlots(openHour: number, closeHour: number, durationMinutes: number): string[] {
  const slots: string[] = [];
  let current = openHour * 60;
  const close = closeHour * 60;
  while (current + durationMinutes + BUFFER_MINUTES <= close) {
    slots.push(minutesToTime(current));
    current += 30;
  }
  return slots;
}

function getOpeningHours(dateStr: string): { open: number; close: number } | null {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  if (day === 1) return null;
  if (day === 0) return { open: 7, close: 14 };
  return { open: 7, close: 20 };
}

router.get("/available-slots", async (req, res) => {
  const parsed = GetAvailableSlotsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { date, serviceId } = parsed.data;
  const hours = getOpeningHours(date);
  if (!hours) {
    res.json({ date, slots: [] });
    return;
  }

  const service = SERVICES.find(s => s.id === serviceId);
  const duration = service ? service.durationMinutes : 30;

  const allSlots = generateTimeSlots(hours.open, hours.close, duration);

  const booked = await db
    .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.date, date), eq(appointmentsTable.status, "pending")));

  // Build list of [existingStart, existingEnd] windows (duration + buffer)
  const bookedWindows = booked.map(b => {
    const existingService = SERVICES.find(s => s.id === b.serviceId);
    const existingDuration = existingService ? existingService.durationMinutes : 30;
    const start = timeToMinutes(b.time);
    const end = start + existingDuration + BUFFER_MINUTES;
    return { start, end };
  });

  // A slot is available only if [slotStart, slotStart+duration+buffer) does not overlap any booked window
  const available = allSlots.filter(slot => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + duration + BUFFER_MINUTES;
    return !bookedWindows.some(w => slotStart < w.end && slotEnd > w.start);
  });

  res.json({ date, slots: available });
});

router.get("/", async (req, res) => {
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { date, period, status } = parsed.data;

  let conditions = [];

  if (date) {
    conditions.push(eq(appointmentsTable.date, date));
  } else if (period) {
    const range = getDateRange(period);
    if (range) {
      conditions.push(gte(appointmentsTable.date, range.start));
      conditions.push(lte(appointmentsTable.date, range.end));
    }
  }

  if (status) {
    conditions.push(eq(appointmentsTable.status, status));
  }

  const rows = conditions.length > 0
    ? await db.select().from(appointmentsTable).where(and(...conditions)).orderBy(appointmentsTable.date, appointmentsTable.time)
    : await db.select().from(appointmentsTable).orderBy(appointmentsTable.date, appointmentsTable.time);

  res.json(rows.map(r => ({
    ...r,
    servicePrice: Number(r.servicePrice),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { clientName, clientPhone, serviceId, date, time } = parsed.data;

  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) {
    res.status(400).json({ error: "Invalid service ID" });
    return;
  }

  // Overlap check: newStart < existingEnd AND newEnd > existingStart
  const newStart = timeToMinutes(time);
  const newEnd = newStart + service.durationMinutes + BUFFER_MINUTES;

  const sameDayPending = await db
    .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.date, date), eq(appointmentsTable.status, "pending")));

  const hasOverlap = sameDayPending.some(b => {
    const existingService = SERVICES.find(s => s.id === b.serviceId);
    const existingDuration = existingService ? existingService.durationMinutes : 30;
    const existingStart = timeToMinutes(b.time);
    const existingEnd = existingStart + existingDuration + BUFFER_MINUTES;
    return newStart < existingEnd && newEnd > existingStart;
  });

  if (hasOverlap) {
    res.status(409).json({ error: "Horário indisponível" });
    return;
  }

  const [created] = await db.insert(appointmentsTable).values({
    clientName,
    clientPhone,
    serviceId,
    serviceName: service.name,
    servicePrice: service.price.toString(),
    date,
    time,
    status: "pending",
  }).returning();

  res.status(201).json({
    ...created,
    servicePrice: Number(created.servicePrice),
    createdAt: created.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetAppointmentParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [row] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.id));
  if (!row) {
    res.status(404).json({ error: "Agendamento não encontrado" });
    return;
  }
  res.json({ ...row, servicePrice: Number(row.servicePrice), createdAt: row.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateAppointmentParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const bodyParsed = UpdateAppointmentBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const updates: Record<string, unknown> = {};
  const body = bodyParsed.data;
  if (body.status !== undefined) updates.status = body.status;
  if (body.clientName !== undefined) updates.clientName = body.clientName;
  if (body.clientPhone !== undefined) updates.clientPhone = body.clientPhone;
  if (body.date !== undefined) updates.date = body.date;
  if (body.time !== undefined) updates.time = body.time;
  if (body.serviceId !== undefined) {
    const service = SERVICES.find(s => s.id === body.serviceId);
    if (service) {
      updates.serviceId = body.serviceId;
      updates.serviceName = service.name;
      updates.servicePrice = service.price.toString();
    }
  }

  const [updated] = await db
    .update(appointmentsTable)
    .set(updates)
    .where(eq(appointmentsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Agendamento não encontrado" });
    return;
  }

  res.json({ ...updated, servicePrice: Number(updated.servicePrice), createdAt: updated.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteAppointmentParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
