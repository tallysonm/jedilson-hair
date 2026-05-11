import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULTS: Record<string, string> = {
  contact_whatsapp: "5511973436623",
};

async function getSetting(key: string): Promise<string> {
  const [row] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, key))
    .limit(1);
  return row?.value ?? DEFAULTS[key] ?? "";
}

async function upsertSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

router.get("/", async (req, res) => {
  const contactWhatsapp = await getSetting("contact_whatsapp");
  res.json({ contactWhatsapp });
});

router.patch("/", async (req, res) => {
  const { contactWhatsapp } = req.body as { contactWhatsapp?: string };
  if (contactWhatsapp !== undefined) {
    const clean = contactWhatsapp.replace(/\D/g, "");
    await upsertSetting("contact_whatsapp", clean);
  }
  const result = await getSetting("contact_whatsapp");
  res.json({ contactWhatsapp: result });
});

export default router;
