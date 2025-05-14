import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Steam accounts table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  steamId: text("steam_id").notNull().unique(),
  nickname: text("nickname"),
  profileUrl: text("profile_url"),
  avatarUrl: text("avatar_url"),
  isPrivate: boolean("is_private").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schema for accounts
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  lastUpdated: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Cases table
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  appId: text("app_id").notNull(),
  assetId: text("asset_id").notNull(),
  classId: text("class_id").notNull(),
  instanceId: text("instance_id").notNull(),
  marketHashName: text("market_hash_name").notNull(),
  imageUrl: text("image_url"),
  quantity: integer("quantity").notNull().default(1),
  price: real("price"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schema for cases
export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  lastUpdated: true,
});
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  steamApiKey: text("steam_api_key"),
  currency: text("currency").default("USD"),
  requestDelay: integer("request_delay").default(2000), // In milliseconds
  userAgents: jsonb("user_agents").default([]).notNull(), // Array of user agent strings
  lastBackup: timestamp("last_backup"),
});

// Insert schema for settings
export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  lastBackup: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Logs table
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(), // info, warning, error
  message: text("message").notNull(),
  details: jsonb("details"),
});

// Insert schema for logs
export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// Users table (keeping this from the original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
