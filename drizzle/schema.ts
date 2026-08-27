import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const productArchiveExpiryJobs = mysqlTable("product_archive_expiry_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobKey: varchar("jobKey", { length: 64 }).notNull().unique(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("product_archive_expiry_task_idx").on(table.scheduleCronTaskUid)]);

export const businessCategoryValues = ["fashion", "accessories", "beauty", "personal_care", "other"] as const;
export const lifecycleStatusValues = ["planned", "generated", "reviewed", "downloaded", "posted", "archived"] as const;
export const activityTypeValues = ["generated", "reviewed", "downloaded", "posted", "feedback", "archived"] as const;
export const feedbackOutcomeValues = ["not_set", "conversations", "orders", "engagement", "profile_visits", "nothing_yet", "saved_for_later"] as const;
export const cardTypeValues = ["cover", "guide", "checklist", "comparison", "faq", "product", "closing"] as const;
export const generationSourceValues = ["ai", "starter"] as const;
export const contextStatusValues = ["not_started", "dismissed", "completed"] as const;

export const businessProfiles = mysqlTable("business_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: varchar("businessName", { length: 160 }).notNull(),
  businessType: varchar("businessType", { length: 160 }).notNull(),
  businessCategory: mysqlEnum("businessCategory", businessCategoryValues).notNull().default("other"),
  targetAudience: text("targetAudience").notNull(),
  customerMarket: varchar("customerMarket", { length: 160 }).notNull().default("Nigeria"),
  contentPillars: text("contentPillars").notNull(),
  postingGoal: text("postingGoal").notNull(),
  weeklyPostGoal: int("weeklyPostGoal").notNull().default(5),
  brandVoice: varchar("brandVoice", { length: 160 }).notNull().default("Warm, clear, and credible"),
  brandLogoKey: varchar("brandLogoKey", { length: 512 }),
  brandLogoUrl: text("brandLogoUrl"),
  brandPrimaryColor: varchar("brandPrimaryColor", { length: 20 }).notNull().default("#263327"),
  brandAccentColor: varchar("brandAccentColor", { length: 20 }).notNull().default("#EAF2CA"),
  defaultCta: varchar("defaultCta", { length: 120 }).notNull().default("Send us a message to order."),
  instagramHandle: varchar("instagramHandle", { length: 80 }),
  closingSignature: varchar("closingSignature", { length: 140 }),
  businessContext: text("businessContext"),
  businessContextStatus: mysqlEnum("businessContextStatus", contextStatusValues).notNull().default("not_started"),
  productInviteStatus: mysqlEnum("productInviteStatus", contextStatusValues).notNull().default("not_started"),
  isOnboarded: boolean("isOnboarded").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("business_profile_user_idx").on(table.userId)]);

export const contentFormatValues = ["caption", "carousel", "tip", "promo", "story"] as const;
export const contentStatusValues = ["planned", "completed"] as const;
export const contentEntryTypeValues = ["calendar", "product_education"] as const;
export const visualDeliverableTypeValues = ["single_post", "carousel", "story"] as const;
export const visualDeliverableStatusValues = ["draft", "generating", "ready", "failed"] as const;
export const visualGenerationModeValues = ["standard", "stylish"] as const;
export const visualSlideSourceValues = ["product", "ai_product", "generated", "template"] as const;
export const productMediaRoleValues = ["primary", "gallery"] as const;
export const productArchiveStatusValues = ["active", "archived"] as const;

export const contentItems = mysqlTable("content_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  profileId: int("profileId").notNull().references(() => businessProfiles.id, { onDelete: "cascade" }),
  productId: int("productId").references(() => products.id, { onDelete: "set null" }),
  sourceContentItemId: int("sourceContentItemId"),
  entryType: mysqlEnum("entryType", contentEntryTypeValues).notNull().default("calendar"),
  plannedFor: varchar("plannedFor", { length: 10 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  objective: varchar("objective", { length: 120 }).notNull(),
  format: mysqlEnum("format", contentFormatValues).notNull(),
  brief: text("brief").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags"),
  carouselSlides: text("carouselSlides"),
  requiresProduct: boolean("requiresProduct").notNull().default(false),
  preparationNote: varchar("preparationNote", { length: 280 }),
  status: mysqlEnum("status", contentStatusValues).notNull().default("planned"),
  lifecycleStatus: mysqlEnum("lifecycleStatus", lifecycleStatusValues).notNull().default("planned"),
  generatedAt: timestamp("generatedAt"),
  reviewedAt: timestamp("reviewedAt"),
  downloadedAt: timestamp("downloadedAt"),
  postedAt: timestamp("postedAt"),
  feedbackOutcome: mysqlEnum("feedbackOutcome", feedbackOutcomeValues).notNull().default("not_set"),
  feedbackNote: text("feedbackNote"),
  generationSource: mysqlEnum("generationSource", generationSourceValues).notNull().default("ai"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("content_item_user_date_idx").on(table.userId, table.plannedFor), index("content_item_profile_idx").on(table.profileId), index("content_item_entry_type_idx").on(table.userId, table.entryType)]);

export const contentActivityEvents = mysqlTable("content_activity_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentItemId: int("contentItemId").notNull().references(() => contentItems.id, { onDelete: "cascade" }),
  deliverableId: int("deliverableId"),
  eventType: mysqlEnum("eventType", activityTypeValues).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("content_activity_item_idx").on(table.contentItemId, table.createdAt), index("content_activity_user_idx").on(table.userId, table.createdAt)]);

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  price: varchar("price", { length: 80 }),
  currency: varchar("currency", { length: 12 }).notNull().default("NGN"),
  details: text("details"),
  productCategory: varchar("productCategory", { length: 100 }),
  bestFor: varchar("bestFor", { length: 320 }),
  choiceReasons: text("choiceReasons"),
  buyerNote: varchar("buyerNote", { length: 500 }),
  categoryDetails: text("categoryDetails"),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  archiveStatus: mysqlEnum("archiveStatus", productArchiveStatusValues).notNull().default("active"),
  archivedAt: timestamp("archivedAt"),
  archiveExpiresAt: timestamp("archiveExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("product_user_idx").on(table.userId), index("product_archive_expiry_idx").on(table.archiveStatus, table.archiveExpiresAt)]);

export const productMedia = mysqlTable("product_media", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", productMediaRoleValues).notNull().default("gallery"),
  sortOrder: int("sortOrder").notNull().default(0),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull().default("image/jpeg"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("product_media_product_idx").on(table.productId, table.sortOrder)]);

export const visualDeliverables = mysqlTable("visual_deliverables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentItemId: int("contentItemId").references(() => contentItems.id, { onDelete: "set null" }),
  productId: int("productId").references(() => products.id, { onDelete: "set null" }),
  type: mysqlEnum("type", visualDeliverableTypeValues).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  aspectRatio: varchar("aspectRatio", { length: 20 }).notNull().default("1:1"),
  generationMode: mysqlEnum("generationMode", visualGenerationModeValues).notNull().default("standard"),
  status: mysqlEnum("status", visualDeliverableStatusValues).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("visual_user_idx").on(table.userId), index("visual_content_idx").on(table.contentItemId)]);

export const visualSlides = mysqlTable("visual_slides", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull().references(() => visualDeliverables.id, { onDelete: "cascade" }),
  slideNumber: int("slideNumber").notNull(),
  heading: varchar("heading", { length: 240 }).notNull(),
  body: text("body"),
  eyebrow: varchar("eyebrow", { length: 100 }),
  footer: varchar("footer", { length: 180 }),
  cardType: mysqlEnum("cardType", cardTypeValues).notNull().default("guide"),
  sourceMode: mysqlEnum("sourceMode", visualSlideSourceValues).notNull().default("template"),
  assetKey: varchar("assetKey", { length: 512 }),
  assetUrl: text("assetUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("visual_slide_order_idx").on(table.deliverableId, table.slideNumber)]);

export const productSellingPackages = mysqlTable("product_selling_packages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  deliverableId: int("deliverableId").notNull().references(() => visualDeliverables.id, { onDelete: "cascade" }),
  productId: int("productId").references(() => products.id, { onDelete: "set null" }),
  caption: text("caption").notNull(),
  buyerReply: text("buyerReply").notNull(),
  nextAngleTitle: varchar("nextAngleTitle", { length: 240 }).notNull(),
  nextAngleDescription: text("nextAngleDescription").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("selling_package_deliverable_idx").on(table.deliverableId), index("selling_package_user_idx").on(table.userId)]);

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;
export type ContentActivityEvent = typeof contentActivityEvents.$inferSelect;
export type InsertContentActivityEvent = typeof contentActivityEvents.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductMedia = typeof productMedia.$inferSelect;
export type InsertProductMedia = typeof productMedia.$inferInsert;
export type VisualDeliverable = typeof visualDeliverables.$inferSelect;
export type InsertVisualDeliverable = typeof visualDeliverables.$inferInsert;
export type VisualSlide = typeof visualSlides.$inferSelect;
export type InsertVisualSlide = typeof visualSlides.$inferInsert;
export type ProductSellingPackage = typeof productSellingPackages.$inferSelect;
export type InsertProductSellingPackage = typeof productSellingPackages.$inferInsert;
