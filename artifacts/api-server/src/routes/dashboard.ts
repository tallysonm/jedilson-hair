import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

function getNDaysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
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
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
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
