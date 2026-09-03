import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const THROTTLE_MS = 60_000;
const FALLBACK_DURATION_MINUTES = 30;

let lastRunAt = 0;
let inFlight: Promise<number> | null = null;

/**
 * Concludes appointments whose service ended more than 60 minutes ago.
 *
 * The deadline is computed entirely in Postgres using America/Sao_Paulo so the
 * result does not depend on the serverless runtime timezone (Vercel runs in UTC).
 * Only `status` is written: every other column (date, time, service_price,
 * payment_method, ...) is left untouched so revenue stays in the original month.
 */
export async function autoCompleteDueAppointments(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE appointments AS a
    SET status = 'completed'
    FROM (
      SELECT
        ap.id,
        (ap.date || ' ' || ap.time)::timestamp
          + make_interval(mins => COALESCE(s.duration_minutes, ${sql.raw(String(FALLBACK_DURATION_MINUTES))}) + 60) AS due_at
      FROM appointments AS ap
      LEFT JOIN services AS s ON s.id = ap.service_id
      WHERE ap.status = 'pending'
    ) AS d
    WHERE a.id = d.id
      AND a.status = 'pending'
      AND d.due_at <= (now() AT TIME ZONE 'America/Sao_Paulo')
  `);

  return result.rowCount ?? 0;
}

/**
 * Throttled, fire-safe wrapper used by the request middleware. Never throws.
 */
export async function runAutoCompleteSweep(): Promise<void> {
  if (inFlight) return;

  const now = Date.now();
  if (now - lastRunAt < THROTTLE_MS) return;
  lastRunAt = now;

  inFlight = autoCompleteDueAppointments();

  try {
    const updated = await inFlight;
    if (updated > 0) {
      logger.info({ updated }, "Auto-completed due appointments");
    }
  } catch (err) {
    logger.error({ err }, "Auto-complete sweep failed");
  } finally {
    inFlight = null;
  }
}
