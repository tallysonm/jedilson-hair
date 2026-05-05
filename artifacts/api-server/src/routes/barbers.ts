import { Router } from "express";
import { db } from "@workspace/db";
import { barbersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_BARBERS = [
  { name: "Jedilson", photo: null, active: true },
  { name: "Barbeiro 2", photo: null, active: true },
  { name: "Barbeiro 3", photo: null, active: true },
];

async function seedBarbers() {
  const existing = await db.select().from(barbersTable);
  if (existing.length === 0) {
    await db.insert(barbersTable).values(DEFAULT_BARBERS);
  }
}

seedBarbers().catch(() => {});

router.get("/", async (_req, res) => {
  const rows = await db.select().from(barbersTable).orderBy(barbersTable.id);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { name, photo } = req.body as { name: string; photo?: string | null };
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [created] = await db
    .insert(barbersTable)
    .values({ name, photo: photo ?? null, active: true })
    .returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { name, photo, active } = req.body as { name?: string; photo?: string | null; active?: boolean };
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (photo !== undefined) updates.photo = photo;
  if (active !== undefined) updates.active = active;

  const [updated] = await db
    .update(barbersTable)
    .set(updates)
    .where(eq(barbersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Barbeiro não encontrado" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
