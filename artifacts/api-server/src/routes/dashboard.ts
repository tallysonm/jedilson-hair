import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/require-admin";

const router = Router();

router.use(requireAdmin);

const SP_TIME_ZONE = "America/Sao_Paulo";

// en-CA renders as YYYY-MM-DD, matching the text format stored in appointments.date
const spDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDateStr(d: Date) {
  const year = String(d.getUTCFullYear()).padStart(4, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Current calendar date in America/Sao_Paulo, shifted by `offsetDays`. */
function getSpDateStr(offsetDays = 0) {
  const [year, month, day] = spDateFormatter.format(new Date()).split("-").map(Number);
  // Noon UTC keeps the arithmetic away from any DST/offset boundary.
  return formatDateStr(new Date(Date.UTC(year!, month! - 1, day! + offsetDays, 12)));
}

function getTodayStr() {
  return getSpDateStr();
}

function getTomorrowStr() {
  return getSpDateStr(1);
}

function getMonthRange() {
  const [year, month] = getTodayStr().split("-").map(Number);
  const start = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const end = formatDateStr(new Date(Date.UTC(year!, month!, 0, 12)));
  return { start, end };
}

function getNDaysAgoStr(n: number) {
  return getSpDateStr(-n);
}

router.get("/summary", async (_req, res) => {
  const today = getTodayStr();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const [todayCompleted, monthCompleted, todayAll, pendingRows] = await Promise.all([
    db.select().from(appointmentsTable).where(and(eq(appointmentsTable.date, today), eq(appointmentsTable.status, "completed"))),
    db.select().from(appointmentsTable).where(and(gte(appointmentsTable.date, monthStart), lte(appointmentsTable.date, monthEnd), eq(appointmentsTable.status, "completed"))),
    db.select().from(appointmentsTable).where(eq(appointmentsTable.date, today)),
    db.select().from(appointmentsTable).where(eq(appointmentsTable.status, "pending")),
  ]);

  const todayRevenue = todayCompleted.reduce((sum, r) => sum + Number(r.servicePrice), 0);
  const monthRevenue = monthCompleted.reduce((sum, r) => sum + Number(r.servicePrice), 0);
  const getPrice = (r: any) => Number(r.servicePrice ?? r.service_price ?? 0);
const getPayment = (r: any) => String(r.paymentMethod ?? r.payment_method ?? "");

const todayRevenueCash = todayCompleted
  .filter((r: any) => getPayment(r) === "dinheiro")
  .reduce((sum: number, r: any) => sum + getPrice(r), 0);

const todayRevenuePixCard = todayCompleted
  .filter((r: any) => getPayment(r) === "pix_cartao")
  .reduce((sum: number, r: any) => sum + getPrice(r), 0);

const monthRevenueCash = monthCompleted
  .filter((r: any) => getPayment(r) === "dinheiro")
  .reduce((sum: number, r: any) => sum + getPrice(r), 0);

const monthRevenuePixCard = monthCompleted
  .filter((r: any) => getPayment(r) === "pix_cartao")
  .reduce((sum: number, r: any) => sum + getPrice(r), 0);

  res.json({
  todayRevenue,
  monthRevenue,
  todayRevenueCash,
  todayRevenuePixCard,
  monthRevenueCash,
  monthRevenuePixCard,
  todayAppointments: todayAll.length,
  monthAppointments: monthCompleted.length,
  pendingAppointments: pendingRows.length,
  completedToday: todayCompleted.length,
});
});

router.get("/revenue-chart", async (_req, res) => {
  const startDate = getNDaysAgoStr(29);
  const today = getTodayStr();

  // Single query: group by date for the last 30 days
  const rows = await db
    .select({
      date: appointmentsTable.date,
      revenue: sql<number>`SUM(CAST(${appointmentsTable.servicePrice} AS NUMERIC))`,
      appointments: sql<number>`COUNT(*)`,
    })
    .from(appointmentsTable)
    .where(
      and(
        gte(appointmentsTable.date, startDate),
        lte(appointmentsTable.date, today),
        eq(appointmentsTable.status, "completed"),
      )
    )
    .groupBy(appointmentsTable.date)
    .orderBy(appointmentsTable.date);

  // Build a map for quick lookup
  const dataMap = new Map<string, { revenue: number; appointments: number }>();
  for (const r of rows) {
    dataMap.set(r.date, { revenue: Number(r.revenue), appointments: Number(r.appointments) });
  }

  // Fill in all 30 days (including days with zero activity)
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const dateStr = getNDaysAgoStr(i);
    const entry = dataMap.get(dateStr);
    result.push({
      date: dateStr,
      revenue: entry?.revenue ?? 0,
      appointments: entry?.appointments ?? 0,
    });
  }

  res.json(result);
});

router.get("/services-chart", async (_req, res) => {
  // Single query: group by service
  const rows = await db
    .select({
      serviceId: appointmentsTable.serviceId,
      serviceName: appointmentsTable.serviceName,
      count: sql<number>`COUNT(*)`,
      revenue: sql<number>`SUM(CAST(${appointmentsTable.servicePrice} AS NUMERIC))`,
    })
    .from(appointmentsTable)
    .where(eq(appointmentsTable.status, "completed"))
    .groupBy(appointmentsTable.serviceId, appointmentsTable.serviceName)
    .orderBy(sql`COUNT(*) DESC`);

  res.json(rows.map(r => ({
    serviceId: r.serviceId,
    serviceName: r.serviceName,
    count: Number(r.count),
    revenue: Number(r.revenue),
  })));
});

router.get("/reminders", async (_req, res) => {
  const tomorrow = getTomorrowStr();
  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.date, tomorrow), eq(appointmentsTable.status, "pending")))
    .orderBy(appointmentsTable.time);

  res.json(rows.map(r => ({
    ...r,
    servicePrice: Number(r.servicePrice),
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
