import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Identity-provider identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Public projects intentionally shared by an administrator for visitor viewing. */
export const publicProjects = mysqlTable("publicProjects", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: int("ownerId").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  title: varchar("title", { length: 80 }).notNull(),
  category: mysqlEnum("category", ["Game", "Tool", "App", "Portfolio", "Other"]).notNull(),
  note: varchar("note", { length: 160 }).notNull().default(""),
  isPublished: boolean("isPublished").notNull().default(true),
  featuredRank: int("featuredRank").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PublicProject = typeof publicProjects.$inferSelect;
export type InsertPublicProject = typeof publicProjects.$inferInsert;

// TODO: Add your tables here
