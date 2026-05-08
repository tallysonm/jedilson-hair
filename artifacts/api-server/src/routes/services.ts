import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_SERVICES = [
  { id: "corte-simples",                    name: "Corte de cabelo simples",                   price: "35.00",  durationMinutes: 30, sortOrder: 1 },
  { id: "corte-sobrancelha",                name: "Corte de cabelo simples + sobrancelha",     price: "45.00",  durationMinutes: 30, sortOrder: 2 },
  { id: "corte-barba",                      name: "Corte de cabelo + barba",                   price: "60.00",  durationMinutes: 50, sortOrder: 3 },
  { id: "corte-penteado-barba-sobrancelha", name: "Corte + penteado + barba + sobrancelha",   price: "80.00",  durationMinutes: 60, sortOrder: 4 },
  { id: "corte-progressiva",                name: "Corte de cabelo + progressiva",              price: "90.00",  durationMinutes: 90, sortOrder: 5 },
  { id: "dois-cortes",                      name: "2 cortes de cabelo simples",                price: "70.00",  durationMinutes: 60, sortOrder: 6 },
  { id: "pezinho",                          name: "Pezinho do cabelo",                         price: "10.00",  durationMinutes: 5,  sortOrder: 7 },
  { id: "penteado",                         name: "Penteado",                                  price: "25.00",  durationMinutes: 20, sortOrder: 8 },
  { id: "corte-luzes",                      name: "Corte + luzes",                             price: "110.00", durationMinutes: 45, sortOrder: 9 },
  { id: "corte-luzes-branca",               name: "Corte + luzes branca",                     price: "150.00", durationMinutes: 45, sortOrder: 10 },
  { id: "sobrancelha",                      name: "Sobrancelha",                               price: "10.00",  durationMinutes: 5,  sortOrder: 11 },
  { id: "barba",                            name: "Barba",                                     price: "25.00",  durationMinutes: 20, sortOrder: 12 },
  { id: "corte-relaxamento",                name: "Corte de cabelo + relaxamento",             price: "60.00",  durationMinutes: 40, sortOrder: 13 },
  { id: "corte-penteado",                   name: "Corte de cabelo + penteado",                price: "45.00",  durationMinutes: 50, sortOrder: 14 },
  { id: "corte-dimil-colorido",             name: "Corte de cabelo dimil colorido",            price: "50.00",  durationMinutes: 50, sortOrder: 15 },
];

async function seedServices() {
  const existing = await db.select().from(servicesTable);
  if (existing.length === 0) {
    await db.insert(servicesTable).values(DEFAULT_SERVICES);
  }
}

seedServices().catch(() => {});

function formatService(r: typeof servicesTable.$inferSelect) {
  const price = Number(r.price);
  const priceLabel = `R$ ${price.toFixed(2).replace(".", ",")}`;
  const d = r.durationMinutes;
  let durationLabel = `${d}min`;
  if (d >= 60 && d % 60 === 0) durationLabel = `${d / 60}h`;
  else if (d >= 60) durationLabel = `${Math.floor(d / 60)}h${d % 60}min`;
  return {
    id: r.id,
    name: r.name,
    price,
    priceLabel,
    durationMinutes: r.durationMinutes,
    durationLabel,
    active: r.active,
    sortOrder: r.sortOrder,
  };
}

router.get("/", async (_req, res) => {
  const rows = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.active, true))
    .orderBy(servicesTable.sortOrder, servicesTable.name);
  res.json(rows.map(formatService));
});

router.post("/", async (req, res) => {
  const { id, name, price, durationMinutes, sortOrder } = req.body as {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    sortOrder?: number;
  };
  if (!id || !name || !price || !durationMinutes) {
    res.status(400).json({ error: "id, name, price e durationMinutes são obrigatórios" });
    return;
  }
  const slugId = id.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [created] = await db
    .insert(servicesTable)
    .values({
      id: slugId,
      name,
      price: price.toString(),
      durationMinutes,
      sortOrder: sortOrder ?? 99,
      active: true,
    })
    .returning();
  res.status(201).json(formatService(created));
});

router.patch("/:id", async (req, res) => {
  const id = req.params["id"];
  if (!id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const { name, price, durationMinutes, active, sortOrder } = req.body as {
    name?: string;
    price?: number;
    durationMinutes?: number;
    active?: boolean;
    sortOrder?: number;
  };

  const updates: Record<string, unknown> = {};
  if (name            !== undefined) updates.name            = name;
  if (price           !== undefined) updates.price           = price.toString();
  if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
  if (active          !== undefined) updates.active          = active;
  if (sortOrder       !== undefined) updates.sortOrder       = sortOrder;

  const [updated] = await db
    .update(servicesTable)
    .set(updates)
    .where(eq(servicesTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Serviço não encontrado" });
    return;
  }
  res.json(formatService(updated));
});

router.delete("/:id", async (req, res) => {
  const id = req.params["id"];
  if (!id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  await db
    .update(servicesTable)
    .set({ active: false })
    .where(eq(servicesTable.id, id));
  res.status(204).send();
});

export { formatService };
export default router;
