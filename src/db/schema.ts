import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("innovator"), // 'innovator' | 'investor' | 'admin'
  city: text("city").default("تهران"),
  bio: text("bio"),
  companyName: text("company_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investorProfiles = pgTable("investor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationName: text("organization_name").notNull(),
  membershipPlan: text("membership_plan").notNull().default("pro"), // 'starter' | 'pro' | 'enterprise'
  membershipStatus: text("membership_status").notNull().default("active"), // 'pending' | 'active' | 'expired'
  membershipExpiresAt: timestamp("membership_expires_at"),
  preferredCategories: jsonb("preferred_categories").$type<string[]>().notNull(),
  preferredStages: jsonb("preferred_stages").$type<string[]>().notNull(),
  minBudgetToman: bigint("min_budget_toman", { mode: "number" }).notNull(),
  maxBudgetToman: bigint("max_budget_toman", { mode: "number" }).notNull(),
  investmentThesis: text("investment_thesis").notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull(),
  verified: boolean("verified").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  marketPotential: text("market_potential").notNull(),
  category: text("category").notNull(),
  stage: text("stage").notNull(), // 'concept' | 'prototype' | 'mvp' | 'growth'
  fundingNeededToman: bigint("funding_needed_toman", { mode: "number" }).notNull(),
  equityOfferedPercent: integer("equity_offered_percent").notNull().default(15),
  teamSize: integer("team_size").notNull().default(2),
  innovatorAge: integer("innovator_age").default(24),
  city: text("city").default("تهران"),
  tags: jsonb("tags").$type<string[]>().notNull(),
  coverImage: text("cover_image").notNull(),
  demoUrl: text("demo_url"),
  prestashopProductRef: text("prestashop_product_ref"),
  listingFeePaid: boolean("listing_fee_paid").notNull().default(false),
  listingPlan: text("listing_plan").notNull().default("standard"), // 'standard' | 'featured'
  fundingStatus: text("funding_status").notNull().default("unfunded"), // 'unfunded' | 'negotiating' | 'funded'
  aiReadinessScore: integer("ai_readiness_score").notNull().default(80),
  viewsCount: integer("views_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  paymentType: text("payment_type").notNull(), // 'idea_listing' | 'investor_membership'
  referenceId: integer("reference_id"),
  planName: text("plan_name").notNull(),
  amountToman: bigint("amount_toman", { mode: "number" }).notNull(),
  status: text("status").notNull().default("paid"), // 'pending' | 'paid' | 'failed'
  trackingCode: text("tracking_code").notNull().unique(),
  gateway: text("gateway").notNull().default("زرین‌پال (شبیه‌ساز اختصاصی)"),
  sourceChannel: text("source_channel").default("direct"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiMatches = pgTable("ai_matches", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
  investorProfileId: integer("investor_profile_id")
    .notNull()
    .references(() => investorProfiles.id, { onDelete: "cascade" }),
  compatibilityScore: integer("compatibility_score").notNull(),
  categoryScore: integer("category_score").notNull(),
  budgetScore: integer("budget_score").notNull(),
  stageScore: integer("stage_score").notNull(),
  synergyScore: integer("synergy_score").notNull(),
  aiSummary: text("ai_summary").notNull(),
  aiHighlights: jsonb("ai_highlights").$type<string[]>().notNull(),
  aiRiskNote: text("ai_risk_note").notNull(),
  status: text("status").notNull().default("suggested"), // 'suggested' | 'interested' | 'meeting_requested' | 'funded' | 'declined'
  investorMessage: text("investor_message"),
  proposedAmountToman: bigint("proposed_amount_toman", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InvestorProfile = typeof investorProfiles.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AiMatch = typeof aiMatches.$inferSelect;
