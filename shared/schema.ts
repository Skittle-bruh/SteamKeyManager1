import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Steam accounts table
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  steamId: text("steamId").notNull().unique(),
  nickname: text("nickname"),
  avatarUrl: text("avatarUrl"),
  isPrivate: integer("isPrivate", { mode: 'boolean' }).default(false),
  lastUpdated: text("lastUpdated").default("datetime('now')"),
});

// Insert schema for accounts
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  lastUpdated: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Cases table
export const cases = sqliteTable("cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("accountId").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  appId: integer("appId").notNull(),
  assetId: text("assetId").notNull(),
  marketHashName: text("marketHashName").notNull(),
  iconUrl: text("iconUrl"),
  imageUrl: text("imageUrl"),
  quantity: integer("quantity").notNull().default(1),
  price: real("price"),
  lastUpdated: text("lastUpdated").default("datetime('now')"),
});

// Insert schema for cases
export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  lastUpdated: true,
});
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

// Settings table
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  currency: text("currency").default("USD").notNull(),
  requestDelay: integer("requestDelay").default(2000).notNull(),
  userAgents: text("userAgents").notNull(), // JSON string of array
});

// Insert schema for settings
export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Logs table
export const logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").default("datetime('now')"),
  level: text("level").notNull(), // info, warning, error
  message: text("message").notNull(),
  details: text("details"), // JSON string
});

// Insert schema for logs
export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// Users table (keeping this from the original schema)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  hashedPassword: text("hashedPassword").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  hashedPassword: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
