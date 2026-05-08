import { Router } from "express";
import { db } from "@workspace/db";
import { blockedSlotsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function formatSlot(r: typeof blockedSlotsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const date = typeof req.query["date"] === "string" ? req.query["date"] : undefined;
  const rows = date
    ? await db.select().from(blockedSlotsTable).where(eq(blockedSlotsTable.date, date)).orderBy(blockedSlotsTable.date, blockedSlotsTable.time)
    : await db.select().from(blockedSlotsTable).orderBy(blockedSlotsTable.date, blockedSlotsTable.time);
  res.json(rows.map(formatSlot));
});

router.post("/", async (req, res) => {
  const { date, time, reason, allDay } = req.body as {
    date: string;
    time?: string | null;
    reason?: string | null;
    allDay?: boolean;
  };
  if (!date) {
    res.status(400).json({ error: "date é obrigatório" });
    return;
  }
  const [created] = await db
    .insert(blockedSlotsTable)
    .values({
      date,
      time: time ?? null,
      reason: reason ?? null,
      allDay: allDay ?? (!time),
    })
    .returning();
  res.status(201).json(formatSlot(created));
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  await db.delete(blockedSlotsTable).where(eq(blockedSlotsTable.id, id));
  res.status(204).send();
});

export default router;
