import { Router, type IRouter, type Response } from "express";
import { db, appointmentsTable, barbersTable, clientsTable } from "@workspace/db";
import { and, eq, or, sql } from "drizzle-orm";
import { requireCustomer, type CustomerAuthLocals } from "../middlewares/require-customer";

const router: IRouter = Router();

// Somente dígitos; remove o "55" (código do país) quando o número já inclui DDD + 9 dígitos.
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }
  return digits.length >= 10 ? digits : null;
}

// Telefone da conta autenticada, obtido exclusivamente de clients.phone via clients.auth_user_id = auth.uid().
// Nunca aceitar telefone vindo de body/query/params.
async function getAccountNormalizedPhone(authUserId: string): Promise<string | null> {
  const [client] = await db
    .select({ phone: clientsTable.phone })
    .from(clientsTable)
    .where(eq(clientsTable.authUserId, authUserId))
    .limit(1);

  if (!client?.phone) return null;
  return normalizePhone(client.phone);
}

// Compara clientPhone (formato livre) normalizado com o telefone (já normalizado, sem "55") da conta.
function matchesAccountPhone(normalizedAccountPhone: string) {
  return sql`regexp_replace(${appointmentsTable.clientPhone}, '\D', '', 'g') IN (${normalizedAccountPhone}, ${"55" + normalizedAccountPhone})`;
}

router.get("/me", requireCustomer, (_req, res: Response<unknown, CustomerAuthLocals>) => {
  const { id, email } = res.locals.customerUser;
  res.json({ id, email });
});

router.get("/appointments", requireCustomer, async (_req, res: Response<unknown, CustomerAuthLocals>) => {
  const customerEmail = res.locals.customerUser.email;
  const normalizedAccountPhone = await getAccountNormalizedPhone(res.locals.customerUser.id);

  if (!customerEmail && !normalizedAccountPhone) {
    res.status(400).json({ error: "Authenticated user has no email." });
    return;
  }

  const ownershipConditions = [];
  if (customerEmail) ownershipConditions.push(eq(appointmentsTable.clientEmail, customerEmail));
  if (normalizedAccountPhone) ownershipConditions.push(matchesAccountPhone(normalizedAccountPhone));

  const rows = await db
    .select({
      id: appointmentsTable.id,
      serviceName: appointmentsTable.serviceName,
      servicePrice: appointmentsTable.servicePrice,
      barberId: appointmentsTable.barberId,
      date: appointmentsTable.date,
      time: appointmentsTable.time,
      status: appointmentsTable.status,
      paymentMethod: appointmentsTable.paymentMethod,
      isRecurring: appointmentsTable.isRecurring,
    })
    .from(appointmentsTable)
    .where(or(...ownershipConditions))
    .orderBy(appointmentsTable.date, appointmentsTable.time);

  const allBarbers = await db
    .select({ id: barbersTable.id, name: barbersTable.name })
    .from(barbersTable);

  const barberNameById = new Map(allBarbers.map((barber) => [String(barber.id), barber.name]));

  res.json(
    rows.map((row) => ({
      ...row,
      servicePrice: Number(row.servicePrice),
      barberName: row.barberId ? (barberNameById.get(row.barberId) ?? null) : null,
    })),
  );
});

router.patch(
  "/appointments/:id/cancel",
  requireCustomer,
  async (req, res: Response<unknown, CustomerAuthLocals>) => {
    const customerEmail = res.locals.customerUser.email;
    const normalizedAccountPhone = await getAccountNormalizedPhone(res.locals.customerUser.id);

    if (!customerEmail && !normalizedAccountPhone) {
      res.status(400).json({ error: "Authenticated user has no email." });
      return;
    }

    const parsedId = Number(req.params["id"]);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      res.status(400).json({ error: "Invalid appointment ID." });
      return;
    }

    const ownershipConditions = [];
    if (customerEmail) ownershipConditions.push(eq(appointmentsTable.clientEmail, customerEmail));
    if (normalizedAccountPhone) ownershipConditions.push(matchesAccountPhone(normalizedAccountPhone));

    const [appointment] = await db
      .select({
        id: appointmentsTable.id,
        clientEmail: appointmentsTable.clientEmail,
        status: appointmentsTable.status,
        date: appointmentsTable.date,
        time: appointmentsTable.time,
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.id, parsedId),
          or(...ownershipConditions),
        ),
      )
      .limit(1);

    if (!appointment) {
      res.status(404).json({ error: "Agendamento não encontrado." });
      return;
    }

    if (appointment.status !== "pending") {
      res.status(409).json({ error: "Somente agendamentos pendentes podem ser cancelados." });
      return;
    }

    const [year, month, day] = appointment.date.split("-").map(Number);
    const [hour, minute] = appointment.time.split(":").map(Number);

    if (
      !year || !month || !day ||
      Number.isNaN(hour) || Number.isNaN(minute)
    ) {
      res.status(400).json({ error: "Data ou horário do agendamento é inválido." });
      return;
    }

    const appointmentDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    const cutoffDateTime = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
    const now = new Date();

    if (now > cutoffDateTime) {
      res.status(409).json({
        error:
          "Cancelamentos pelo site são permitidos até 30 minutos antes do horário. Entre em contato com a barbearia.",
      });
      return;
    }

    const [updated] = await db
      .update(appointmentsTable)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(appointmentsTable.id, parsedId),
          or(...ownershipConditions),
        ),
      )
      .returning({
        id: appointmentsTable.id,
        status: appointmentsTable.status,
      });

    if (!updated) {
      res.status(404).json({ error: "Agendamento não encontrado." });
      return;
    }

    res.json(updated);
  },
);

export default router;