import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  businessProfiles,
  contentActivityEvents,
  contentItems,
  productArchiveExpiryJobs,
  productMedia,
  productSellingPackages,
  products,
  visualDeliverables,
  visualSlides,
  type InsertBusinessProfile,
  type InsertContentActivityEvent,
  type InsertContentItem,
  type InsertProductMedia,
  type InsertProductSellingPackage,
  type InsertProduct,
  type InsertUser,
  type InsertVisualDeliverable,
  type InsertVisualSlide,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getBusinessProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertBusinessProfile(profile: Omit<InsertBusinessProfile, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(businessProfiles).values(profile).onDuplicateKeyUpdate({
    set: {
      businessName: profile.businessName,
      businessType: profile.businessType,
      businessCategory: profile.businessCategory ?? "other",
      targetAudience: profile.targetAudience,
      customerMarket: profile.customerMarket ?? "Nigeria",
      contentPillars: profile.contentPillars,
      postingGoal: profile.postingGoal,
      weeklyPostGoal: profile.weeklyPostGoal,
      brandVoice: profile.brandVoice,
      brandPrimaryColor: profile.brandPrimaryColor ?? "#263327",
      brandAccentColor: profile.brandAccentColor ?? "#EAF2CA",
      defaultCta: profile.defaultCta ?? "Send us a message to order.",
      isOnboarded: profile.isOnboarded,
      updatedAt: new Date(),
    },
  });
  const saved = await getBusinessProfileByUserId(profile.userId);
  if (!saved) throw new Error("Business profile could not be saved.");
  return saved;
}

export async function updateBusinessContext(userId: number, context: string, status: "dismissed" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(businessProfiles).set({ businessContext: context, businessContextStatus: status, updatedAt: new Date() }).where(eq(businessProfiles.userId, userId));
  return getBusinessProfileByUserId(userId);
}

export async function updateProductInviteStatus(userId: number, status: "dismissed" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(businessProfiles).set({ productInviteStatus: status, updatedAt: new Date() }).where(eq(businessProfiles.userId, userId));
  return getBusinessProfileByUserId(userId);
}

export async function updateBrandIdentity(userId: number, identity: { instagramHandle?: string | null; closingSignature?: string | null; brandLogoKey?: string | null; brandLogoUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const updates = Object.fromEntries(Object.entries(identity).filter(([, value]) => value !== undefined));
  await db.update(businessProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(businessProfiles.userId, userId));
  return getBusinessProfileByUserId(userId);
}

export async function getContentItemForDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.plannedFor, date), eq(contentItems.entryType, "calendar"))).orderBy(desc(contentItems.createdAt)).limit(1);
  return result[0];
}

export async function getContentItemById(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.id, itemId))).limit(1);
  return result[0];
}

export async function getContentItemsForRange(userId: number, start: string, end: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.entryType, "calendar"), gte(contentItems.plannedFor, start), lte(contentItems.plannedFor, end))).orderBy(contentItems.plannedFor);
}

export async function getRecentContentItems(userId: number, limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentItems).where(eq(contentItems.userId, userId)).orderBy(desc(contentItems.createdAt)).limit(limit);
}

export async function getCompletedContentDates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ plannedFor: contentItems.plannedFor }).from(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.entryType, "calendar"), eq(contentItems.status, "completed")));
  return rows.map(row => row.plannedFor);
}

export async function createContentItem(item: Omit<InsertContentItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.insert(contentItems).values(item);
  const saved = await getContentItemById(item.userId, Number(result[0].insertId));
  if (!saved) throw new Error("Content item could not be saved.");
  return saved;
}

export function isTransientDatabaseError(error: unknown) {
  const candidate = error as { code?: unknown; message?: unknown } | undefined;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  return ["ECONNRESET", "ETIMEDOUT", "PROTOCOL_CONNECTION_LOST", "ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(code)
    || /connection (?:lost|reset)|socket hang up|deadlock|lock wait timeout/i.test(message);
}

export async function updateGeneratedContent(userId: number, itemId: number, updates: Pick<InsertContentItem, "title" | "objective" | "format" | "brief" | "caption" | "hashtags" | "carouselSlides" | "requiresProduct" | "preparationNote">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const values = { ...updates, lifecycleStatus: "generated" as const, generatedAt: new Date(), updatedAt: new Date() };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await db.update(contentItems).set(values).where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));
      return getContentItemById(userId, itemId);
    } catch (error) {
      if (attempt === 1 || !isTransientDatabaseError(error)) {
        console.error("[ViraSquare generation] generated content save failed", error);
        throw error;
      }
      console.warn("[ViraSquare generation] generated content save failed once; retrying", error);
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }
  return getContentItemById(userId, itemId);
}

export async function updateContentLifecycle(userId: number, itemId: number, lifecycleStatus: InsertContentItem["lifecycleStatus"], feedback?: { outcome?: InsertContentItem["feedbackOutcome"]; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const now = new Date();
  const timestamps = lifecycleStatus === "reviewed" ? { reviewedAt: now } : lifecycleStatus === "downloaded" ? { downloadedAt: now } : lifecycleStatus === "posted" ? { postedAt: now, status: "completed" as const, completedAt: now } : {};
  await db.update(contentItems).set({ lifecycleStatus, ...timestamps, ...(feedback?.outcome ? { feedbackOutcome: feedback.outcome } : {}), ...(feedback?.note !== undefined ? { feedbackNote: feedback.note } : {}), updatedAt: now }).where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));
  return getContentItemById(userId, itemId);
}

export async function attachProductToContent(userId: number, itemId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(contentItems).set({ productId, requiresProduct: true, preparationNote: "Use the saved product image and the facts you supplied for this product.", updatedAt: new Date() }).where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));
  return getContentItemById(userId, itemId);
}

export async function recordContentActivity(event: Omit<InsertContentActivityEvent, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(contentActivityEvents).values(event);
}

export async function listContentActivity(userId: number, limit = 80) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentActivityEvents).where(eq(contentActivityEvents.userId, userId)).orderBy(desc(contentActivityEvents.createdAt)).limit(limit);
}

export async function setContentCompletion(userId: number, itemId: number, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(contentItems).set({ status: completed ? "completed" : "planned", completedAt: completed ? new Date() : null, updatedAt: new Date() }).where(and(eq(contentItems.id, itemId), eq(contentItems.userId, userId)));
  return getContentItemById(userId, itemId);
}

export async function removePlannedContentFromDate(userId: number, startDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.delete(contentItems).where(and(eq(contentItems.userId, userId), eq(contentItems.entryType, "calendar"), gte(contentItems.plannedFor, startDate), eq(contentItems.status, "planned")));
}

export async function replaceContentForDate(item: Omit<InsertContentItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const existing = await getContentItemForDate(item.userId, item.plannedFor);
  if (!existing) return createContentItem(item);
  await db.update(contentItems).set({ title: item.title, objective: item.objective, format: item.format, brief: item.brief, caption: null, hashtags: null, carouselSlides: null, productId: item.productId ?? null, requiresProduct: item.requiresProduct ?? false, preparationNote: item.preparationNote ?? null, status: "planned", lifecycleStatus: "planned", generatedAt: null, reviewedAt: null, downloadedAt: null, postedAt: null, completedAt: null, updatedAt: new Date() }).where(and(eq(contentItems.id, existing.id), eq(contentItems.userId, item.userId)));
  const saved = await getContentItemById(item.userId, existing.id);
  if (!saved) throw new Error("Content item could not be replaced.");
  return saved;
}

export async function listProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.userId, userId), eq(products.archiveStatus, "active"))).orderBy(desc(products.createdAt));
}

export async function listArchivedProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.userId, userId), eq(products.archiveStatus, "archived"))).orderBy(desc(products.archivedAt));
}

export async function countProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: products.id }).from(products).where(and(eq(products.userId, userId), eq(products.archiveStatus, "active")));
  return rows.length;
}

export async function getProductById(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.userId, userId), eq(products.id, productId), eq(products.archiveStatus, "active"))).limit(1);
  return result[0];
}

export async function getProductRecordById(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.userId, userId), eq(products.id, productId))).limit(1);
  return result[0];
}

export async function createProduct(product: Omit<InsertProduct, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.insert(products).values(product);
  const saved = await getProductById(product.userId, Number(result[0].insertId));
  if (!saved) throw new Error("Product could not be saved.");
  return saved;
}

export async function updateProduct(userId: number, productId: number, updates: Pick<InsertProduct, "name" | "price" | "currency" | "details" | "productCategory" | "bestFor" | "choiceReasons" | "buyerNote" | "categoryDetails">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const existing = await getProductById(userId, productId);
  if (!existing) return undefined;
  await db.update(products).set({ ...updates, buyerNote: updates.buyerNote ?? existing.buyerNote, categoryDetails: updates.categoryDetails ?? existing.categoryDetails, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.userId, userId)));
  return getProductById(userId, productId);
}

export async function archiveProduct(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 30);
  await db.update(products).set({ archiveStatus: "archived", archivedAt: now, archiveExpiresAt: expiresAt, updatedAt: now }).where(and(eq(products.id, productId), eq(products.userId, userId), eq(products.archiveStatus, "active")));
  return getProductRecordById(userId, productId);
}

export async function restoreArchivedProduct(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(products).set({ archiveStatus: "active", archivedAt: null, archiveExpiresAt: null, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.userId, userId), eq(products.archiveStatus, "archived")));
  return getProductById(userId, productId);
}

export async function permanentlyDeleteExpiredProducts(now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const expired = await db.select({ id: products.id, userId: products.userId }).from(products).where(and(eq(products.archiveStatus, "archived"), lte(products.archiveExpiresAt, now)));
  for (const product of expired) {
    await db.delete(products).where(and(eq(products.id, product.id), eq(products.archiveStatus, "archived"), lte(products.archiveExpiresAt, now)));
  }
  return expired.length;
}

export async function permanentlyDeleteArchivedProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const archived = await db.select({ id: products.id }).from(products).where(and(eq(products.userId, userId), eq(products.archiveStatus, "archived")));
  if (archived.length === 0) return 0;
  await db.delete(products).where(and(eq(products.userId, userId), eq(products.archiveStatus, "archived")));
  return archived.length;
}

const PRODUCT_ARCHIVE_EXPIRY_JOB_KEY = "product-archive-expiry";

export async function getProductArchiveExpiryJobByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.select().from(productArchiveExpiryJobs).where(eq(productArchiveExpiryJobs.scheduleCronTaskUid, taskUid)).limit(1);
  return result[0];
}

export async function saveProductArchiveExpiryTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(productArchiveExpiryJobs).values({ jobKey: PRODUCT_ARCHIVE_EXPIRY_JOB_KEY, scheduleCronTaskUid: taskUid }).onDuplicateKeyUpdate({ set: { scheduleCronTaskUid: taskUid, updatedAt: new Date() } });
}

export async function listProductMedia(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productMedia).where(eq(productMedia.productId, productId)).orderBy(asc(productMedia.sortOrder), asc(productMedia.createdAt));
}

export async function addProductMedia(media: Omit<InsertProductMedia, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.insert(productMedia).values(media);
  const rows = await db.select().from(productMedia).where(eq(productMedia.id, Number(result[0].insertId))).limit(1);
  const saved = rows[0];
  if (!saved) throw new Error("Product media could not be saved.");
  return saved;
}

export async function getProductWithMedia(userId: number, productId: number) {
  const product = await getProductById(userId, productId);
  if (!product) return undefined;
  const media = await listProductMedia(product.id);
  return { ...product, media };
}

export async function createVisualDeliverable(deliverable: Omit<InsertVisualDeliverable, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.insert(visualDeliverables).values(deliverable);
  const id = Number(result[0].insertId);
  const saved = await getVisualDeliverableById(deliverable.userId, id);
  if (!saved) throw new Error("Visual deliverable could not be saved.");
  return saved;
}

export async function updateVisualDeliverableStatus(userId: number, deliverableId: number, status: InsertVisualDeliverable["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(visualDeliverables).set({ status, updatedAt: new Date() }).where(and(eq(visualDeliverables.id, deliverableId), eq(visualDeliverables.userId, userId)));
}

export async function replaceVisualSlides(deliverableId: number, slides: Array<Omit<InsertVisualSlide, "id" | "createdAt" | "updatedAt" | "deliverableId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.delete(visualSlides).where(eq(visualSlides.deliverableId, deliverableId));
  if (slides.length) await db.insert(visualSlides).values(slides.map(slide => ({ ...slide, deliverableId })));
}

export async function updateVisualSlideAsset(deliverableId: number, slideNumber: number, updates: Pick<InsertVisualSlide, "assetKey" | "assetUrl" | "sourceMode" | "heading" | "body" | "eyebrow" | "footer" | "cardType">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(visualSlides).set({ ...updates, updatedAt: new Date() }).where(and(eq(visualSlides.deliverableId, deliverableId), eq(visualSlides.slideNumber, slideNumber)));
}

export async function getVisualDeliverableById(userId: number, deliverableId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(visualDeliverables).where(and(eq(visualDeliverables.userId, userId), eq(visualDeliverables.id, deliverableId))).limit(1);
  const deliverable = result[0];
  if (!deliverable) return undefined;
  const slides = await db.select().from(visualSlides).where(eq(visualSlides.deliverableId, deliverableId)).orderBy(asc(visualSlides.slideNumber));
  return { ...deliverable, slides };
}

export async function getProductSellingPackage(userId: number, deliverableId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(productSellingPackages).where(and(eq(productSellingPackages.userId, userId), eq(productSellingPackages.deliverableId, deliverableId))).limit(1);
  return rows[0];
}

export async function upsertProductSellingPackage(sellingPackage: Omit<InsertProductSellingPackage, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(productSellingPackages).values(sellingPackage).onDuplicateKeyUpdate({ set: { productId: sellingPackage.productId, caption: sellingPackage.caption, buyerReply: sellingPackage.buyerReply, nextAngleTitle: sellingPackage.nextAngleTitle, nextAngleDescription: sellingPackage.nextAngleDescription, updatedAt: new Date() } });
  const saved = await getProductSellingPackage(sellingPackage.userId, sellingPackage.deliverableId);
  if (!saved) throw new Error("The product selling package could not be saved.");
  return saved;
}

export async function listVisualDeliverablesByUserId(userId: number, limit = 12) {
  const db = await getDb();
  if (!db) return [];
  const deliverables = await db.select().from(visualDeliverables).where(eq(visualDeliverables.userId, userId)).orderBy(desc(visualDeliverables.updatedAt)).limit(limit);
  return Promise.all(deliverables.map(item => getVisualDeliverableById(userId, item.id)));
}

export async function listContentLibrary(userId: number, limit = 80) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentItems).where(eq(contentItems.userId, userId)).orderBy(desc(contentItems.updatedAt)).limit(limit);
}

export async function getProductUsage(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [userProducts, deliverables, content] = await Promise.all([
    db.select().from(products).where(eq(products.userId, userId)),
    db.select().from(visualDeliverables).where(eq(visualDeliverables.userId, userId)),
    db.select().from(contentItems).where(eq(contentItems.userId, userId)),
  ]);
  const lifecycleByContentId = new Map(content.map(item => [item.id, item.lifecycleStatus]));
  return userProducts.map(product => {
    const linked = deliverables.filter(deliverable => deliverable.productId === product.id);
    return {
      productId: product.id,
      visualCount: linked.length,
      postedCount: linked.filter(deliverable => deliverable.contentItemId && lifecycleByContentId.get(deliverable.contentItemId) === "posted").length,
      lastUsedAt: linked.reduce<Date | null>((latest, deliverable) => !latest || deliverable.updatedAt > latest ? deliverable.updatedAt : latest, null),
    };
  });
}
