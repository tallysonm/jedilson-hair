import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, servicesTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";

const router = Router();

const BUFFER_MINUTES = 0;

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

function generateRecurringDates(weekday: number, startDate: string, endDate: string): string[] {
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  const dates: string[] = [];

  if (end < start) return dates;

  let current = new Date(start);

  while (current <= end) {
    if (current.getDay() === weekday) {
      dates.push(current.toISOString().split("T")[0]);
    }

    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
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
  const { clientName, clientPhone, serviceId, time, weekday, startDate, endDate, barberId, paymentMethod } = req.body as {
  clientName: string; clientPhone: string; serviceId: string; time: string;
  weekday: number; startDate: string; endDate: string; barberId?: string; paymentMethod?: "dinheiro" | "pix_cartao";
};

console.log("RECURRING BODY:", req.body);
console.log("FIELDS:", { clientName, clientPhone, serviceId, time, weekday, startDate, endDate, barberId, paymentMethod });
  if (!clientName || !clientPhone || !serviceId || !time || weekday == null || !startDate || !endDate) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  
  const service = await getServiceFromDb(serviceId);
  if (!service) {
    res.status(400).json({ error: "Serviço inválido" });
    return;
  }

const targetDates = generateRecurringDates(weekday, startDate, endDate);
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
      paymentMethod: paymentMethod === "pix_cartao" ? "pix_cartao" : "dinheiro",
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
