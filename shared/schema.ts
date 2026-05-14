import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  subscriptionTier: text("subscription_tier"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  username: text("username").notNull(),
  followers: integer("followers"),
  lastScraped: timestamp("last_scraped"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userCreatorUnique: sql`UNIQUE (${table.userId}, ${table.username})`,
}));

export const reels = pgTable("reels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => creators.id).notNull(),
  instagramId: text("instagram_id").notNull().unique(),
  url: text("url").notNull(),
  caption: text("caption"),
  videoUrl: text("video_url"),
  datePosted: timestamp("date_posted"),
  manualTags: text("manual_tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reelMetrics = pgTable("reel_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reelId: varchar("reel_id").references(() => reels.id).notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  views: integer("views").default(0),
  hashtags: text("hashtags"),
  mentions: text("mentions"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

export const scrapeRuns = pgTable("scrape_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull(),
  usernames: jsonb("usernames").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  logs: text("logs"),
  reelsScraped: integer("reels_scraped").default(0),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userKeyUnique: sql`UNIQUE (${table.userId}, ${table.key})`,
}));

export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseKey: text("license_key").notNull().unique(),
  deviceId: text("device_id"),
  deviceName: text("device_name"),
  instanceId: text("instance_id"),
  status: text("status").notNull(),
  activatedAt: timestamp("activated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  lastValidated: timestamp("last_validated"),
  lemonsqueezyData: jsonb("lemonsqueezy_data"),
  productId: text("product_id"),
  variantId: text("variant_id"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  paymentId: varchar("payment_id"),
  isRenewal: text("is_renewal").default("false"),
  previousLicenseId: varchar("previous_license_id"),
  licenseType: text("license_type").default("monthly"),
  isAdmin: text("is_admin").default("false"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseId: varchar("license_id").references(() => licenses.id),
  customerId: varchar("customer_id").references(() => customers.id),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id").notNull().unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  paymentData: jsonb("payment_data"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  licenseKey: text("license_key"),
  licenseSentAt: timestamp("license_sent_at"),
  webhookVerified: text("webhook_verified").default("false"),
  priceUsd: integer("price_usd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── OutreachOS: Instagram Follower Scraper ───────────────────────────────────

export const outreachJobs = pgTable("outreach_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetUsername: text("target_username").notNull(),
  targetUserId: text("target_user_id"),
  status: text("status").notNull().default("queued"),
  totalScraped: integer("total_scraped").notNull().default(0),
  currentMaxId: text("current_max_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const outreachFollowers = pgTable("outreach_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => outreachJobs.id).notNull(),
  username: text("username").notNull(),
  fullName: text("full_name"),
  userId: text("user_id").notNull(),
  profilePicUrl: text("profile_pic_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  isPrivate: boolean("is_private").notNull().default(false),
  followerCount: integer("follower_count"),
  scrapedFrom: text("scraped_from").notNull(),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

export const outreachSkipped = pgTable("outreach_skipped", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => outreachJobs.id).notNull(),
  username: text("username").notNull(),
  reason: text("reason").notNull().default("Private Account"),
  scrapedFrom: text("scraped_from").notNull(),
  skippedAt: timestamp("skipped_at").notNull().defaultNow(),
});

// ─── OutreachOS: DM Campaigns ─────────────────────────────────────────────────

export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  messageTemplate: text("message_template").notNull(),
  messageTemplateB: text("message_template_b"),
  abTestEnabled: boolean("ab_test_enabled").notNull().default(false),
  targetJobId: varchar("target_job_id").references(() => outreachJobs.id),
  status: text("status").notNull().default("draft"),
  totalTargets: integer("total_targets").notNull().default(0),
  totalSent: integer("total_sent").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  totalSentA: integer("total_sent_a").notNull().default(0),
  totalSentB: integer("total_sent_b").notNull().default(0),
  webhookUrl: text("webhook_url"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledStop: timestamp("scheduled_stop"),
  filterMinFollowers: integer("filter_min_followers"),
  filterMaxFollowers: integer("filter_max_followers"),
  filterExcludePrivate: boolean("filter_exclude_private").notNull().default(false),
  filterExcludeVerified: boolean("filter_exclude_verified").notNull().default(false),
  dmSendStyle: text("dm_send_style").notNull().default("instant"),
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const outreachDmTargets = pgTable("outreach_dm_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => outreachCampaigns.id).notNull(),
  followerId: varchar("follower_id").references(() => outreachFollowers.id),
  username: text("username").notNull(),
  status: text("status").notNull().default("pending"),
  abVariant: text("ab_variant"),
  scheduledSendAt: timestamp("scheduled_send_at"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── OutreachOS: Proxy Management ────────────────────────────────────────────

export const proxies = pgTable("proxies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocol: text("protocol").notNull().default("http"),
  host: text("host").notNull(),
  port: text("port").notNull(),
  username: text("username"),
  password: text("password"),
  status: text("status").notNull().default("untested"),
  lastTestedAt: timestamp("last_tested_at"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── OutreachOS: Instagram Accounts ──────────────────────────────────────────

export const igAccounts = pgTable("ig_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  twoFaSecret: text("two_fa_secret"),
  status: text("status").notNull().default("active"),
  warmupDay: integer("warmup_day").notNull().default(0),
  proxyId: varchar("proxy_id").references(() => proxies.id),
  sessionData: jsonb("session_data"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Twitter Scraper ──────────────────────────────────────────────────────────

export const twitterJobs = pgTable("twitter_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetUsername: text("target_username").notNull(),
  status: text("status").notNull().default("queued"),
  totalFollowers: integer("total_followers").notNull().default(0),
  totalEnriched: integer("total_enriched").notNull().default(0),
  totalDmOpen: integer("total_dm_open").notNull().default(0),
  progressPct: integer("progress_pct").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const twitterFollowers = pgTable("twitter_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => twitterJobs.id).notNull(),
  twitterId: text("twitter_id").notNull(),
  username: text("username").notNull(),
  name: text("name"),
  location: text("location"),
  canDm: boolean("can_dm").notNull().default(false),
  followersCount: integer("followers_count"),
  isVerified: boolean("is_verified").notNull().default(false),
  description: text("description"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  subscriptionStatus: true,
  subscriptionTier: true,
});

export const insertCreatorSchema = createInsertSchema(creators);
export const insertReelSchema = createInsertSchema(reels);
export const insertReelMetricsSchema = createInsertSchema(reelMetrics);
export const insertScrapeRunSchema = createInsertSchema(scrapeRuns);
export const insertSettingsSchema = createInsertSchema(settings);
export const insertLicenseSchema = createInsertSchema(licenses);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertCustomerSchema = createInsertSchema(customers);

export const scraperConfigSchema = z.object({
  targetUsername: z.string(),
  scheduleFrequency: z.string(),
  autoTag: z.boolean(),
});

export const instagramCredentialsSchema = z.object({
  instagramUsername: z.string().min(1, "Instagram username is required"),
  instagramPassword: z.string().min(1, "Instagram password is required"),
});

export const licenseActivationSchema = z.object({
  licenseKey: z.string().min(10, "Valid license key is required"),
  deviceName: z.string().optional(),
});

export const nowPaymentSchema = z.object({
  price_amount: z.number(),
  price_currency: z.string(),
  pay_currency: z.string(),
  order_id: z.string(),
  order_description: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Reel = typeof reels.$inferSelect;
export type ReelMetrics = typeof reelMetrics.$inferSelect;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type ScraperConfig = z.infer<typeof scraperConfigSchema>;
export type InstagramCredentials = z.infer<typeof instagramCredentialsSchema>;
export type LicenseActivation = z.infer<typeof licenseActivationSchema>;
export type NowPayment = z.infer<typeof nowPaymentSchema>;
export type OutreachJob = typeof outreachJobs.$inferSelect;
export type OutreachFollower = typeof outreachFollowers.$inferSelect;
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type Proxy = typeof proxies.$inferSelect;
export type IgAccount = typeof igAccounts.$inferSelect;
export type TwitterJob = typeof twitterJobs.$inferSelect;
export type TwitterFollower = typeof twitterFollowers.$inferSelect;
