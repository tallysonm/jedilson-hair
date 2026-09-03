import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, blockedSlotsTable, servicesTable, barbersTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  CreateAppointmentBody,
  UpdateAppointmentBody,
  UpdateAppointmentParams,
  GetAppointmentParams,
  DeleteAppointmentParams,
  GetAvailableSlotsQueryParams,
} from "@workspace/api-zod";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { requireAdmin } from "../middlewares/require-admin";

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

const BUFFER_MINUTES = 0;

function getOccupiedMinutes(durationMinutes: number): number {
  return Math.ceil(durationMinutes / 30) * 30;
}

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
  const occupiedDuration = getOccupiedMinutes(durationMinutes);
  while (current + occupiedDuration + BUFFER_MINUTES <= close) {
    slots.push(minutesToTime(current));
    current += 30;
  }
  return slots;
}

function getOpeningHours(dateStr: string): { open: number; close: number } | null {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();

  // Segunda-feira fechado
  if (day === 1) return null;

  // Domingo: 06:30 às 12:30
  if (day === 0) return { open: 6.5, close: 12.5 };

  // Terça a sábado: 06:30 às 21:00
  return { open: 6.5, close: 21 };
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
  const occupiedDuration = getOccupiedMinutes(duration);

  const allSlots = generateTimeSlots(hours.open, hours.close, duration);

  // Blocked specific time slots
  const blockedTimes = await db
    .select({ time: blockedSlotsTable.time })
    .from(blockedSlotsTable)
    .where(and(eq(blockedSlotsTable.date, date), eq(blockedSlotsTable.allDay, false)));
  const blockedTimeSet = new Set(blockedTimes.map(b => b.time).filter(Boolean));
  const weekday = new Date(`${date}T12:00:00`).getDay();

// Terça a Domingo - bloqueia 08:00
if (weekday >= 2 || weekday === 0) {
  blockedTimeSet.add("08:00");
}

// Terça a Sexta - bloqueia almoço
if (weekday >= 2 && weekday <= 5) {
  blockedTimeSet.add("11:30");
  blockedTimeSet.add("12:00");
  blockedTimeSet.add("12:30");
  blockedTimeSet.add("13:00");
  blockedTimeSet.add("13:30");
}

// Sábado - bloqueia 13:00 e 13:30
if (weekday === 6) {
  blockedTimeSet.add("13:00");
  blockedTimeSet.add("13:30");
}

const blockedIntervals = Array.from(blockedTimeSet).map((blockedTime) => {
  const start = timeToMinutes(String(blockedTime));

  return {
    start,
    end: start + 30,
  };
});

  const baseConditions = [eq(appointmentsTable.date, date), ne(appointmentsTable.status, "cancelled")];
  if (barberId) baseConditions.push(eq(appointmentsTable.barberId, barberId));

  const booked = await db
    .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId, isManual: appointmentsTable.isManual })
    .from(appointmentsTable)
    .where(
  and(
    ...baseConditions,
    ne(appointmentsTable.status, "cancelled")
  )
);

  // Agendamento manual do Admin fora da grade normal não consome slot do cliente.
  const normalSlotSet = new Set(allSlots);
  const bookedAffectingClient = booked.filter((b) => !b.isManual || normalSlotSet.has(b.time));

  const bookedWindows = await Promise.all(bookedAffectingClient.map(async b => {
    const existingService = await getServiceFromDb(b.serviceId);
    const existingDuration = existingService ? existingService.durationMinutes : 30;
    const existingOccupiedDuration = getOccupiedMinutes(existingDuration);
    const start = timeToMinutes(b.time);
    const end = start + existingOccupiedDuration + BUFFER_MINUTES;
    return { start, end };
  }));

  const available = allSlots.filter((slot) => {
  const slotStart = timeToMinutes(slot);
  const slotEnd = slotStart + occupiedDuration + BUFFER_MINUTES;

  const overlapsBlockedInterval = blockedIntervals.some(
    (blocked) => slotStart < blocked.end && slotEnd > blocked.start,
  );

  if (overlapsBlockedInterval) return false;

  return !bookedWindows.some(
    (booked) => slotStart < booked.end && slotEnd > booked.start,
  );
});

  res.json({ date, slots: available });
});

router.get("/month-availability", async (req, res) => {
  const month = typeof req.query["month"] === "string" ? req.query["month"] : undefined;
  const serviceId = typeof req.query["serviceId"] === "string" ? req.query["serviceId"] : undefined;
  const barberId = typeof req.query["barberId"] === "string" ? req.query["barberId"] : undefined;

  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    res.status(400).json({ error: "Invalid month format, expected YYYY-MM" });
    return;
  }
  if (!serviceId) {
    res.status(400).json({ error: "serviceId is required" });
    return;
  }

  const service = await getServiceFromDb(serviceId);
  const duration = service ? service.durationMinutes : 30;
  const occupiedDuration = getOccupiedMinutes(duration);

  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  const maxAllowedDate = getMaxAllowedDate();
  const now = new Date();
  // Local date (not UTC) to match the rest of the scheduling rules
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Whole-day blocks for the month (same source used by /available-slots, one query instead of one per day)
  const allDayBlocks = await db
    .select({ date: blockedSlotsTable.date })
    .from(blockedSlotsTable)
    .where(and(
      gte(blockedSlotsTable.date, monthStart),
      lte(blockedSlotsTable.date, monthEnd),
      eq(blockedSlotsTable.allDay, true),
    ));
  const allDayBlockedSet = new Set(allDayBlocks.map((b) => b.date));

  // Specific blocked time slots for the month, grouped by date
  const timeBlocks = await db
    .select({ date: blockedSlotsTable.date, time: blockedSlotsTable.time })
    .from(blockedSlotsTable)
    .where(and(
      gte(blockedSlotsTable.date, monthStart),
      lte(blockedSlotsTable.date, monthEnd),
      eq(blockedSlotsTable.allDay, false),
    ));
  const blockedTimesByDate = new Map<string, Set<string>>();
  for (const b of timeBlocks) {
    if (!b.time) continue;
    if (!blockedTimesByDate.has(b.date)) blockedTimesByDate.set(b.date, new Set());
    blockedTimesByDate.get(b.date)!.add(b.time);
  }

  // Existing (non-cancelled) appointments for the month, same barberId semantics as /available-slots
  const appointmentConditions = [
    gte(appointmentsTable.date, monthStart),
    lte(appointmentsTable.date, monthEnd),
    ne(appointmentsTable.status, "cancelled"),
  ];
  if (barberId) appointmentConditions.push(eq(appointmentsTable.barberId, barberId));

  const bookedRows = await db
    .select({ date: appointmentsTable.date, time: appointmentsTable.time, serviceId: appointmentsTable.serviceId, isManual: appointmentsTable.isManual })
    .from(appointmentsTable)
    .where(and(...appointmentConditions));

  // All service durations fetched once to resolve occupied windows of existing bookings
  const allServices = await db.select({ id: servicesTable.id, durationMinutes: servicesTable.durationMinutes }).from(servicesTable);
  const serviceDurationMap = new Map(allServices.map((s) => [s.id, s.durationMinutes]));

  const bookedByDate = new Map<string, { time: string; serviceId: string; isManual: boolean }[]>();
  for (const b of bookedRows) {
    if (!bookedByDate.has(b.date)) bookedByDate.set(b.date, []);
    bookedByDate.get(b.date)!.push({ time: b.time, serviceId: b.serviceId, isManual: b.isManual });
  }

  const days: { date: string; available: boolean }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`;

    // Past dates and dates beyond the client's allowed booking window are always unavailable
    if (date < todayStr || date > maxAllowedDate) {
      days.push({ date, available: false });
      continue;
    }

    const hours = getOpeningHours(date);
    if (!hours) {
      days.push({ date, available: false });
      continue;
    }

    if (allDayBlockedSet.has(date)) {
      days.push({ date, available: false });
      continue;
    }

    const allSlots = generateTimeSlots(hours.open, hours.close, duration);
    const normalSlotSet = new Set(allSlots);

    const blockedTimeSet = new Set(blockedTimesByDate.get(date) ?? []);
    const weekday = new Date(`${date}T12:00:00`).getDay();

    // Terça a Domingo - bloqueia 08:00
    if (weekday >= 2 || weekday === 0) {
      blockedTimeSet.add("08:00");
    }

    // Terça a Sexta - bloqueia almoço
    if (weekday >= 2 && weekday <= 5) {
      blockedTimeSet.add("11:30");
      blockedTimeSet.add("12:00");
      blockedTimeSet.add("12:30");
      blockedTimeSet.add("13:00");
      blockedTimeSet.add("13:30");
    }

    // Sábado - bloqueia 13:00 e 13:30
    if (weekday === 6) {
      blockedTimeSet.add("13:00");
      blockedTimeSet.add("13:30");
    }

    const blockedIntervals = Array.from(blockedTimeSet).map((blockedTime) => {
      const start = timeToMinutes(String(blockedTime));
      return { start, end: start + 30 };
    });

    const bookedWindows = (bookedByDate.get(date) ?? [])
      // Agendamento manual do Admin fora da grade normal não consome slot do cliente.
      .filter((b) => !b.isManual || normalSlotSet.has(b.time))
      .map((b) => {
        const existingOccupiedDuration = getOccupiedMinutes(serviceDurationMap.get(b.serviceId) ?? 30);
        const start = timeToMinutes(b.time);
        return { start, end: start + existingOccupiedDuration + BUFFER_MINUTES };
      });

    const hasAvailableSlot = allSlots.some((slot) => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + occupiedDuration + BUFFER_MINUTES;

      const overlapsBlockedInterval = blockedIntervals.some(
        (blocked) => slotStart < blocked.end && slotEnd > blocked.start,
      );
      if (overlapsBlockedInterval) return false;

      return !bookedWindows.some(
        (booked) => slotStart < booked.end && slotEnd > booked.start,
      );
    });

    days.push({ date, available: hasAvailableSlot });
  }

  res.json({ month, days });
});

router.get("/export", requireAdmin, async (req, res) => {
  const view = req.query["view"] === "history" ? "history" : "active";
  const period = typeof req.query["period"] === "string" ? req.query["period"] : "all";
  const barberId = typeof req.query["barberId"] === "string" ? req.query["barberId"] : undefined;
  const search = typeof req.query["search"] === "string" ? req.query["search"].trim() : "";

  const conditions = [];
  if (barberId) conditions.push(eq(appointmentsTable.barberId, barberId));

  const rows = conditions.length > 0
    ? await db.select().from(appointmentsTable).where(and(...conditions))
    : await db.select().from(appointmentsTable);

  // Build barber name lookup
  const allBarbers = await db.select({ id: barbersTable.id, name: barbersTable.name }).from(barbersTable);
  const barberMap = new Map(allBarbers.map(b => [String(b.id), b.name]));

  const statusLabel = (s: string) => s === "completed" ? "Concluído" : s === "cancelled" ? "Cancelado" : "Pendente";

  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const formatLocalDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const getAppointmentDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

  const getPeriodBounds = () => {
    if (period === "all") return null;

    const start = new Date(now);
    const end = new Date(now);

    if (period === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (period === "week") {
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - now.getDay());

      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setFullYear(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const periodBounds = getPeriodBounds();
  const normalizedSearch = search.toLowerCase();

  const matchesPeriod = (dateTime: Date) => {
    if (!periodBounds) return true;
    return dateTime >= periodBounds.start && dateTime <= periodBounds.end;
  };

  const matchesSearch = (clientName: string) => {
    if (!normalizedSearch) return true;
    return clientName.trim().toLowerCase().includes(normalizedSearch);
  };

  const filteredRows = rows.filter((row) => {
    const dateTime = getAppointmentDateTime(row.date, row.time);
    const isHistory = row.status === "completed" || row.status === "cancelled" || dateTime < now;
    const isActive = row.status === "pending" && dateTime >= now;

    if (view === "active" && !isActive) return false;
    if (view === "history" && !isHistory) return false;

    if (!matchesPeriod(dateTime)) return false;
    if (!matchesSearch(row.clientName)) return false;

    return true;
  });

  const sortedRows = filteredRows.sort((a, b) => {
    const aDate = getAppointmentDateTime(a.date, a.time).getTime();
    const bDate = getAppointmentDateTime(b.date, b.time).getTime();
    return view === "active" ? aDate - bDate : bDate - aDate;
  });

  const serializeCsvField = (value: unknown) => {
    const safe = value == null ? "" : String(value);
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const currencyBRL = (value: unknown) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));

  const header = "Cliente;Telefone;Serviço;Data;Horário;Barbeiro;Pagamento;Status;Valor;Recorrente\n";
  const lines = sortedRows.map((r) => {
    const barberName = r.barberId ? (barberMap.get(r.barberId) ?? r.barberId) : "";
    return [
      serializeCsvField(r.clientName),
      serializeCsvField(r.clientPhone),
      serializeCsvField(r.serviceName),
      serializeCsvField(r.date),
      serializeCsvField(r.time),
      serializeCsvField(barberName),
      serializeCsvField(r.paymentMethod ?? ""),
      serializeCsvField(statusLabel(r.status)),
      serializeCsvField(currencyBRL(r.servicePrice)),
      serializeCsvField(r.isRecurring ? "Sim" : "Não"),
    ].join(";");
  }).join("\n");

  const csv = header + lines;

  const fileDate = formatLocalDate(now);
  const filename = view === "history"
    ? `historico-agendamentos-${fileDate}.csv`
    : `agendamentos-${fileDate}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csv); // BOM for Excel compatibility
});

router.get("/", requireAdmin, async (req, res) => {
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
  if (parsed.success) {
    console.log("BODY RECEBIDO:", parsed.data);
  }
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { clientName, clientPhone, clientEmail, serviceId, date, time, paymentMethod } = parsed.data;

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
  const newEnd = newStart + getOccupiedMinutes(service.durationMinutes) + BUFFER_MINUTES;

  const barberId = typeof (req.body as Record<string, unknown>)["barberId"] === "string"
    ? (req.body as Record<string, unknown>)["barberId"] as string
    : null;

  // When a specific barber is requested, only check that barber's slots.
  // When no barber is specified ("any available"), check all unassigned + all barbers
  // to avoid double-booking the same generic slot.
  const conflictConditions = [eq(appointmentsTable.date, date), ne(appointmentsTable.status, "cancelled")];
  if (barberId) conflictConditions.push(eq(appointmentsTable.barberId, barberId));

  const sameDayPending = await db
    .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId, barberId: appointmentsTable.barberId })
    .from(appointmentsTable)
    .where(and(...conflictConditions));

  const hasOverlap = (await Promise.all(sameDayPending.map(async b => {
    const existingService = await getServiceFromDb(b.serviceId);
    const existingDuration = existingService ? existingService.durationMinutes : 30;
    const existingOccupiedDuration = getOccupiedMinutes(existingDuration);
    const existingStart = timeToMinutes(b.time);
    const existingEnd = existingStart + existingOccupiedDuration + BUFFER_MINUTES;
    return newStart < existingEnd && newEnd > existingStart;
  }))).some(Boolean);

  if (hasOverlap) {
    res.status(409).json({ error: "Horário indisponível" });
    return;
  }

  const [created] = await db.insert(appointmentsTable).values({
    clientName,
    clientPhone,
    clientEmail: clientEmail ?? null,
    serviceId,
    serviceName: service.name,
    servicePrice: service.price,
    paymentMethod,
    date,
    time,
    barberId,
    status: "pending",
  }).returning();

  res.status(201).json(formatAppointment(created));
});

// Criação manual pelo Admin: horário livre (HH:mm) e sobreposição permitida.
router.post("/admin", requireAdmin, async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { clientName, clientPhone, clientEmail, serviceId, date, time, paymentMethod } = parsed.data;

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    res.status(400).json({ error: "Horário inválido. Use o formato HH:mm" });
    return;
  }

  const service = await getServiceFromDb(serviceId);
  if (!service) {
    res.status(400).json({ error: "Serviço inválido" });
    return;
  }

  const barberId = typeof (req.body as Record<string, unknown>)["barberId"] === "string"
    ? (req.body as Record<string, unknown>)["barberId"] as string
    : null;

  const [created] = await db.insert(appointmentsTable).values({
    clientName,
    clientPhone,
    clientEmail: clientEmail ?? null,
    serviceId,
    serviceName: service.name,
    servicePrice: service.price,
    paymentMethod,
    date,
    time,
    barberId,
    isManual: true,
    status: "pending",
  }).returning();

  res.status(201).json(formatAppointment(created));
});

router.get("/:id", requireAdmin, async (req, res) => {
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

router.patch("/:id", requireAdmin, async (req, res) => {
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
  if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
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

router.delete("/group/:groupId", requireAdmin, async (req, res) => {
  const groupId = req.params["groupId"];
  if (typeof groupId !== "string" || !groupId) {
    res.status(400).json({ error: "Invalid group ID" });
    return;
  }
  await db.delete(appointmentsTable).where(eq(appointmentsTable.recurrenceGroupId, groupId));
  res.status(204).send();
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteAppointmentParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
