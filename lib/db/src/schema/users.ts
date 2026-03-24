import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Users table — stores registered AI CFO accounts
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // bcrypt-hashed password
  passwordHash: text("password_hash").notNull(),
  // Encrypted Stripe secret key (null until user connects Stripe)
  stripeApiKey: text("stripe_api_key"),
  // Whether this user's Stripe account has been verified as valid
  stripeConnected: boolean("stripe_connected").notNull().default(false),
  // Display name for the connected Stripe account
  stripeAccountName: text("stripe_account_name"),
  // Whether the user is in demo mode (shows simulated SaaS data)
  demoMode: boolean("demo_mode").notNull().default(true),
  // Demo company archetype: saas | marketplace | subscription
  demoCompanyType: text("demo_company_type").notNull().default("saas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
