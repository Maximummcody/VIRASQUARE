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

export const businessProfiles = mysqlTable("business_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: varchar("businessName", { length: 160 }).notNull(),
  businessType: varchar("businessType", { length: 160 }).notNull(),
  targetAudience: text("targetAudience").notNull(),
  contentPillars: text("contentPillars").notNull(),
  postingGoal: text("postingGoal").notNull(),
  weeklyPostGoal: int("weeklyPostGoal").notNull().default(5),
  brandVoice: varchar("brandVoice", { length: 160 }).notNull().default("Warm, clear, and credible"),
  isOnboarded: boolean("isOnboarded").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("business_profile_user_idx").on(table.userId)]);

export const contentFormatValues = ["caption", "carousel", "tip", "promo", "story"] as const;
export const contentStatusValues = ["planned", "completed"] as const;

export const contentItems = mysqlTable("content_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  profileId: int("profileId").notNull().references(() => businessProfiles.id, { onDelete: "cascade" }),
  plannedFor: varchar("plannedFor", { length: 10 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  objective: varchar("objective", { length: 120 }).notNull(),
  format: mysqlEnum("format", contentFormatValues).notNull(),
  brief: text("brief").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags"),
  carouselSlides: text("carouselSlides"),
  status: mysqlEnum("status", contentStatusValues).notNull().default("planned"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("content_item_user_date_idx").on(table.userId, table.plannedFor), index("content_item_profile_idx").on(table.profileId)]);

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;
