import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, servicesTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";

const router = Router();

const BUFFER_MINUTES = 10;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getOpeningHours(dateStr: string): { open: number; close: number } | null {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
if (day === 1) return null;

// Domingo: 06:30 às 12:30
if (day === 0) return { open: 6.5, close: 12.5 };

// Terça a sábado: 06:30 às 21:00
return { open: 6.5, close: 21 };
}

function getMaxAllowedDate(): string {
  const now = new Date();
  const max = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  return max.toISOString().split("T")[0];
}

function generateRecurringDates(weekday: number, period: "this_month" | "next_2_months", startDate: string): string[] {
  const ref = new Date(startDate + "T12:00:00");
  const dates: string[] = [];
  const today = new Date().toISOString().split("T")[0];
  const maxDate = getMaxAllowedDate();
  const months: Array<{ year: number; month: number }> = [];
  months.push({ year: ref.getFullYear(), month: ref.getMonth() });
  if (period === "next_2_months") {
    for (let i = 1; i <= 2; i++) {
      const d = new Date(ref.getFullYear(), ref.getMonth() + i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }
  }
  for (const { year, month } of months) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const candidate = new Date(year, month, day);
      if (candidate.getDay() === weekday) {
        const iso = candidate.toISOString().split("T")[0];
        if (iso >= today && iso <= maxDate) dates.push(iso);
      }
    }
  }
  return dates;
}

function generateGroupId(): string {
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getServiceFromDb(serviceId: string) {
  const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
  return svc ?? null;
}

router.post("/", async (req, res) => {
  const { clientName, clientPhone, serviceId, time, weekday, period, startDate, barberId, paymentMethod } = req.body as {
    clientName: string; clientPhone: string; serviceId: string; time: string;
    weekday: number; period: "this_month" | "next_2_months"; startDate: string; barberId?: string | null; paymentMethod?: string | null;
  };

  if (!clientName || !clientPhone || !serviceId || !time || weekday == null || !period || !startDate) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  if (!["this_month", "next_2_months"].includes(period)) {
    res.status(400).json({ error: "Invalid period" });
    return;
  }

  const service = await getServiceFromDb(serviceId);
  if (!service) {
    res.status(400).json({ error: "Serviço inválido" });
    return;
  }

  const targetDates = generateRecurringDates(weekday, period, startDate);
  if (targetDates.length === 0) {
    res.status(400).json({ error: "Nenhuma data disponível no período selecionado" });
    return;
  }

  const newStart = timeToMinutes(time);
  const newEnd = newStart + service.durationMinutes + BUFFER_MINUTES;
  const groupId = generateGroupId();
  const created: object[] = [];
  const skipped: string[] = [];

  for (const date of targetDates) {
    const hours = getOpeningHours(date);
    if (!hours) { skipped.push(date); continue; }
    if (newStart < hours.open * 60 || newEnd > hours.close * 60) { skipped.push(date); continue; }

    const overlapConditions = [eq(appointmentsTable.date, date), ne(appointmentsTable.status, "cancelled")];
    if (barberId) overlapConditions.push(eq(appointmentsTable.barberId, barberId));

    const sameDayPending = await db
      .select({ time: appointmentsTable.time, serviceId: appointmentsTable.serviceId })
      .from(appointmentsTable)
      .where(and(...overlapConditions));

    const hasOverlap = (await Promise.all(sameDayPending.map(async b => {
      const s = await getServiceFromDb(b.serviceId);
      const d = s ? s.durationMinutes : 30;
      const es = timeToMinutes(b.time);
      const ee = es + d + BUFFER_MINUTES;
      return newStart < ee && newEnd > es;
    }))).some(Boolean);

    if (hasOverlap) { skipped.push(date); continue; }

    const [row] = await db.insert(appointmentsTable).values({
      clientName, clientPhone, serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      date, time,
      barberId: barberId ?? null,
      paymentMethod: paymentMethod ?? null,
      status: "pending",
      isRecurring: true,
      recurrenceType: "monthly_weekly",
      recurrenceGroupId: groupId,
    }).returning();

    created.push({ ...row, servicePrice: Number(row.servicePrice), createdAt: row.createdAt.toISOString() });
  }

  res.status(201).json({ groupId, created, skipped });
});

export default router;
