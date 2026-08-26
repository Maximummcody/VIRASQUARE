import * as db from "./db";

/**
 * Permanently removes only products whose archived retention deadline has passed.
 * The deletion is safe to retry because each call rechecks the archive state and deadline.
 */
export async function expireArchivedProducts(now = new Date()) {
  const permanentlyDeleted = await db.permanentlyDeleteExpiredProducts(now);
  return { permanentlyDeleted, processedAt: now.toISOString() };
}
