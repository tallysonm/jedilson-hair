import { Router } from "express";
import { db } from "@workspace/db";
import { barbersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_BARBERS = [
  { name: "Jedilson", photo: null, active: true, specialty: "Cortes & Barba" },
  { name: "Barbeiro 2", photo: null, active: true, specialty: "Cortes Clássicos" },
  { name: "Barbeiro 3", photo: null, active: true, specialty: "Penteados" },
];

async function seedBarbers() {
  const existing = await db.select().from(barbersTable);
  if (existing.length === 0) {
    await db.insert(barbersTable).values(DEFAULT_BARBERS);
  }
}

seedBarbers().catch(() => {});

function formatBarber(r: typeof barbersTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/", async (_req, res) => {
  const rows = await db.select().from(barbersTable).orderBy(barbersTable.id);
  res.json(rows.map(formatBarber));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const [row] = await db.select().from(barbersTable).where(eq(barbersTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Barbeiro não encontrado" });
    return;
  }
  res.json(formatBarber(row));
});

router.post("/", async (req, res) => {
  const { name, photo, phone, specialty } = req.body as {
    name: string;
    photo?: string | null;
    phone?: string | null;
    specialty?: string | null;
  };
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [created] = await db
    .insert(barbersTable)
    .values({ name, photo: photo ?? null, phone: phone ?? null, specialty: specialty ?? null, active: true })
    .returning();
  res.status(201).json(formatBarber(created));
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { name, photo, phone, birthDate, bio, specialty, instagram, active } = req.body as {
    name?: string;
    photo?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    bio?: string | null;
    specialty?: string | null;
    instagram?: string | null;
    active?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name      !== undefined) updates.name      = name;
  if (photo     !== undefined) updates.photo     = photo;
  if (phone     !== undefined) updates.phone     = phone;
  if (birthDate !== undefined) updates.birthDate = birthDate;
  if (bio       !== undefined) updates.bio       = bio;
  if (specialty !== undefined) updates.specialty = specialty;
  if (instagram !== undefined) updates.instagram = instagram;
  if (active    !== undefined) updates.active    = active;

  const [updated] = await db
    .update(barbersTable)
    .set(updates)
    .where(eq(barbersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Barbeiro não encontrado" });
    return;
  }
  res.json(formatBarber(updated));
});

export default router;
