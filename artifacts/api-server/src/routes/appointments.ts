import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, blockedSlotsTable, servicesTable } from "@workspace/db";
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

const router = Router();

function getDateRange(period: string) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (period === "day") return { start: today, end: today };
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  if (period === "month") {
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

async function getServiceFromDb(serviceId: string) {
  const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
  return svc ?? null;
}

function formatAppointment(r: typeof appointmentsTable.$inferSelect) {
  return {
    ...r,
    servicePrice: Number(r.servicePrice),
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/available-slots", async (req, res) => {
  const parsed = GetAvailableSlotsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { date, serviceId } = parsed.data;
  const barberId = typeof req.query["barberId"] === "string" ? req.query["barberId"] : undefined;

  const hours = getOpeningHours(date);
  if (!hours) {
    res.json({ date, slots: [] });
    return;
  }

  // Check if the whole day is blocked
  const dayBlocked = await db
    .select()
    .from(blockedSlotsTable)
    .where(and(eq(blockedSlotsTable.date, date), eq(blockedSlotsTable.allDay, true)));

  if (dayBlocked.length > 0) {
    res.json({ date, slots: [] });
    return;
  }

  const service = await getServiceFromDb(serviceId);
  const duration = service ? service.durationMinutes : 30;

  const allSlots = generateTimeSlots(hours.open, hours.close, duration);

  // Blocked specific time slots
  const blockedTimes = await db
    .select({ time: blockedSlotsTable.time })
    .from(blockedSlotsTable)
    .where(and(eq(blockedSlotsTable.date, date), eq(blockedSlotsTable.allDay, false)));
  const blockedTimeSet = new Set(blockedTimes.map(b => b.time).filter(Boolean));

  const baseConditions = [eq(appointmentsTable.date, date), eq(appointmentsTable.status, "pending")];
  if (barberId) baseConditions.push(eq(appointmentsTable.barberId, barberId));

  const booked = await db
    .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId })
    .from(appointmentsTable)
    .where(and(...baseConditions));

  const bookedWindows = await Promise.all(booked.map(async b => {
    const existingService = await getServiceFromDb(b.serviceId);
    const existingDuration = existingService ? existingService.durationMinutes : 30;
    const start = timeToMinutes(b.time);
    const end = start + existingDuration + BUFFER_MINUTES;
    return { start, end };
  }));

  const available = allSlots.filter(slot => {
    if (blockedTimeSet.has(slot)) return false;
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + duration + BUFFER_MINUTES;
    return !bookedWindows.some(w => slotStart < w.end && slotEnd > w.start);
  });

  res.json({ date, slots: available });
});

router.get("/export", async (req, res) => {
  const period = typeof req.query["period"] === "string" ? req.query["period"] : "all";
  const barberId = typeof req.query["barberId"] === "string" ? req.query["barberId"] : undefined;

  const conditions = [];
  if (period !== "all") {
    const range = getDateRange(period);
    if (range) {
      conditions.push(gte(appointmentsTable.date, range.start));
      conditions.push(lte(appointmentsTable.date, range.end));
    }
  }
  if (barberId) conditions.push(eq(appointmentsTable.barberId, barberId));

  const rows = conditions.length > 0
    ? await db.select().from(appointmentsTable).where(and(...conditions)).orderBy(appointmentsTable.date, appointmentsTable.time)
    : await db.select().from(appointmentsTable).orderBy(appointmentsTable.date, appointmentsTable.time);

  const statusLabel = (s: string) => s === "completed" ? "Concluído" : s === "cancelled" ? "Cancelado" : "Pendente";

  const header = "ID,Cliente,Telefone,Serviço,Preço,Data,Horário,Barbeiro,Status,Recorrente\n";
  const lines = rows.map(r =>
    [
      r.id,
      `"${r.clientName}"`,
      `"${r.clientPhone}"`,
      `"${r.serviceName}"`,
      Number(r.servicePrice).toFixed(2),
      r.date,
      r.time,
      `"${r.barberId ?? ""}"`,
      statusLabel(r.status),
      r.isRecurring ? "Sim" : "Não",
    ].join(",")
  ).join("\n");

  const csv = header + lines;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="agendamentos-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send("\uFEFF" + csv); // BOM for Excel compatibility
});

router.get("/", async (req, res) => {
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { date, period, status } = parsed.data;
  const barberId = typeof req.query["barberId"] === "string" ? req.query["barberId"] : undefined;

  const conditions = [];
  if (date) {
    conditions.push(eq(appointmentsTable.date, date));
  } else if (period) {
    const range = getDateRange(period);
    if (range) {
      conditions.push(gte(appointmentsTable.date, range.start));
      conditions.push(lte(appointmentsTable.date, range.end));
    }
  }
  if (status) conditions.push(eq(appointmentsTable.status, status));
  if (barberId) conditions.push(eq(appointmentsTable.barberId, barberId));

  const rows = conditions.length > 0
    ? await db.select().from(appointmentsTable).where(and(...conditions)).orderBy(appointmentsTable.date, appointmentsTable.time)
    : await db.select().from(appointmentsTable).orderBy(appointmentsTable.date, appointmentsTable.time);

  res.json(rows.map(formatAppointment));
});

function getMaxAllowedDate(): string {
  const now = new Date();
  const max = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  return max.toISOString().split("T")[0];
}

router.post("/", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { clientName, clientPhone, serviceId, date, time } = parsed.data;

  if (date > getMaxAllowedDate()) {
    res.status(400).json({ error: "Data indisponível para agendamento" });
    return;
  }

  const service = await getServiceFromDb(serviceId);
  if (!service) {
    res.status(400).json({ error: "Serviço inválido" });
    return;
  }

  // Check blocked day
  const dayBlocked = await db
    .select()
    .from(blockedSlotsTable)
    .where(and(eq(blockedSlotsTable.date, date), eq(blockedSlotsTable.allDay, true)));
  if (dayBlocked.length > 0) {
    res.status(409).json({ error: "Este dia está bloqueado para agendamentos" });
    return;
  }

  // Check blocked time slot
  const timeBlocked = await db
    .select()
    .from(blockedSlotsTable)
    .where(and(eq(blockedSlotsTable.date, date), eq(blockedSlotsTable.time, time)));
  if (timeBlocked.length > 0) {
    res.status(409).json({ error: "Este horário está bloqueado" });
    return;
  }

  const newStart = timeToMinutes(time);
  const newEnd = newStart + service.durationMinutes + BUFFER_MINUTES;

  const sameDayPending = await db
    .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.date, date), eq(appointmentsTable.status, "pending")));

  const hasOverlap = (await Promise.all(sameDayPending.map(async b => {
    const existingService = await getServiceFromDb(b.serviceId);
    const existingDuration = existingService ? existingService.durationMinutes : 30;
    const existingStart = timeToMinutes(b.time);
    const existingEnd = existingStart + existingDuration + BUFFER_MINUTES;
    return newStart < existingEnd && newEnd > existingStart;
  }))).some(Boolean);

  if (hasOverlap) {
    res.status(409).json({ error: "Horário indisponível" });
    return;
  }

  const barberId = typeof (req.body as Record<string, unknown>)["barberId"] === "string"
    ? (req.body as Record<string, unknown>)["barberId"] as string
    : null;

  const [created] = await db.insert(appointmentsTable).values({
    clientName,
    clientPhone,
    serviceId,
    serviceName: service.name,
    servicePrice: service.price,
    date,
    time,
    barberId,
    status: "pending",
  }).returning();

  res.status(201).json(formatAppointment(created));
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
  res.json(formatAppointment(row));
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
    const service = await getServiceFromDb(body.serviceId);
    if (service) {
      updates.serviceId = body.serviceId;
      updates.serviceName = service.name;
      updates.servicePrice = service.price;
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
  res.json(formatAppointment(updated));
});

router.delete("/group/:groupId", async (req, res) => {
  const groupId = req.params["groupId"];
  if (!groupId) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }
  await db.delete(appointmentsTable).where(eq(appointmentsTable.recurrenceGroupId, groupId));
  res.status(204).send();
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
