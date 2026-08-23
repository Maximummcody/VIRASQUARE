import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { businessProfiles, contentItems, type InsertBusinessProfile, type InsertContentItem, type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => { if (user[field] !== undefined) { const normalized = user[field] ?? null; values[field] = normalized; updateSet[field] = normalized; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }
export async function getBusinessProfileByUserId(userId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1); return result[0]; }
export async function upsertBusinessProfile(profile: Omit<InsertBusinessProfile, "id" | "createdAt" | "updatedAt">) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.insert(businessProfiles).values(profile).onDuplicateKeyUpdate({ set: { businessName: profile.businessName, businessType: profile.businessType, targetAudience: profile.targetAudience, contentPillars: profile.contentPillars, postingGoal: profile.postingGoal, weeklyPostGoal: profile.weeklyPostGoal, brandVoice: profile.brandVoice, isOnboarded: profile.isOnboarded, updatedAt: new Date() } }); const saved = await getBusinessProfileByUserId(profile.userId); if (!saved) throw new Error("Business profile could not be saved."); return saved; }
export async function getContentItemForDate(userId: number, date: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.plannedFor, date))).orderBy(desc(contentItems.createdAt)).limit(1); return result[0]; }
export async function getContentItemById(userId: number, itemId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.id, itemId))).limit(1); return result[0]; }
export async function getContentItemsForRange(userId: number, start: string, end: string) { const db = await getDb(); if (!db) return []; return db.select().from(contentItems).where(and(eq(contentItems.userId, userId), gte(contentItems.plannedFor, start), lte(contentItems.plannedFor, end))).orderBy(contentItems.plannedFor); }
export async function getRecentContentItems(userId: number, limit = 12) { const db = await getDb(); if (!db) return []; return db.select().from(contentItems).where(eq(contentItems.userId, userId)).orderBy(desc(contentItems.createdAt)).limit(limit); }
export async function getCompletedContentDates(userId: number) { const db = await getDb(); if (!db) return []; const rows = await db.select({ plannedFor: contentItems.plannedFor }).from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.status, "completed"))); return rows.map(row => row.plannedFor); }
export async function createContentItem(item: Omit<InsertContentItem, "id" | "createdAt" | "updatedAt">) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); const result = await db.insert(contentItems).values(item); const saved = await getContentItemById(item.userId, Number(result[0].insertId)); if (!saved) throw new Error("Content item could not be saved."); return saved; }
export async function updateGeneratedContent(userId: number, itemId: number, updates: Pick<InsertContentItem, "title" | "objective" | "format" | "brief" | "caption" | "hashtags" | "carouselSlides">) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.update(contentItems).set({ ...updates, updatedAt: new Date() }).where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId))); return getContentItemById(userId, itemId); }
export async function setContentCompletion(userId: number, itemId: number, completed: boolean) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.update(contentItems).set({ status: completed ? "completed" : "planned", completedAt: completed ? new Date() : null, updatedAt: new Date() }).where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId))); return getContentItemById(userId, itemId); }
export async function removePlannedContentFromDate(userId: number, startDate: string) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); await db.delete(contentItems).where(and(eq(contentItems.userId, userId), gte(contentItems.plannedFor, startDate), eq(contentItems.status, "planned"))); }
export async function replaceContentForDate(item: Omit<InsertContentItem, "id" | "createdAt" | "updatedAt">) { const db = await getDb(); if (!db) throw new Error("Database is unavailable."); const existing = await getContentItemForDate(item.userId, item.plannedFor); if (!existing) return createContentItem(item); await db.update(contentItems).set({ title: item.title, objective: item.objective, format: item.format, brief: item.brief, caption: null, hashtags: null, carouselSlides: null, status: "planned", completedAt: null, updatedAt: new Date() }).where(and(eq(contentItems.id, existing.id), eq(contentItems.userId, item.userId))); const saved = await getContentItemById(item.userId, existing.id); if (!saved) throw new Error("Content item could not be replaced."); return saved; }
