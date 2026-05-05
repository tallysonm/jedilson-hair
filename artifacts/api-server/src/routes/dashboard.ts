import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
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

  res.json({
    todayRevenue,
    monthRevenue,
    todayAppointments: todayAll.length,
    monthAppointments: monthCompleted.length,
    pendingAppointments: pendingRows.length,
    completedToday: todayCompleted.length,
  });
});

router.get("/revenue-chart", async (_req, res) => {
  const now = new Date();
  const result = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const rows = await db
      .select()
      .from(appointmentsTable)
      .where(and(eq(appointmentsTable.date, dateStr), eq(appointmentsTable.status, "completed")));

    const revenue = rows.reduce((sum, r) => sum + Number(r.servicePrice), 0);
    result.push({ date: dateStr, revenue, appointments: rows.length });
  }

  res.json(result);
});

router.get("/services-chart", async (_req, res) => {
  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.status, "completed"));

  const map = new Map<string, { serviceId: string; serviceName: string; count: number; revenue: number }>();

  for (const r of rows) {
    const existing = map.get(r.serviceId);
    if (existing) {
      existing.count++;
      existing.revenue += Number(r.servicePrice);
    } else {
      map.set(r.serviceId, { serviceId: r.serviceId, serviceName: r.serviceName, count: 1, revenue: Number(r.servicePrice) });
    }
  }

  const result = Array.from(map.values()).sort((a, b) => b.count - a.count);
  res.json(result);
});

export default router;
