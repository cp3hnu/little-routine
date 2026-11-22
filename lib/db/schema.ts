import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  locale: text("locale").notNull().default("zh"),
  theme: text("theme").notNull().default("system"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("Asia/Shanghai"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const familyMembers = sqliteTable(
  "family_members",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id),
    role: text("role").notNull().default("owner"),
  },
  (t) => [uniqueIndex("family_members_user_family_idx").on(t.userId, t.familyId)],
);

export const children = sqliteTable("children", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id),
  name: text("name").notNull(),
  targetWakeTime: text("target_wake_time").notNull().default("07:00"),
  targetSleepTime: text("target_sleep_time").notNull().default("21:30"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sleepLogs = sqliteTable(
  "sleep_logs",
  {
    id: text("id").primaryKey(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id),
    localDate: text("local_date").notNull(),
    wakeAt: text("wake_at"),
    sleepAt: text("sleep_at"),
    note: text("note"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("sleep_logs_child_date_idx").on(t.childId, t.localDate)],
);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const reminderPrefs = sqliteTable("reminder_prefs", {
  childId: text("child_id")
    .primaryKey()
    .references(() => children.id),
  wakeRemind: integer("wake_remind", { mode: "boolean" }).notNull().default(true),
  sleepRemind: integer("sleep_remind", { mode: "boolean" }).notNull().default(true),
  minutesBefore: integer("minutes_before").notNull().default(15),
});

export const periodReports = sqliteTable(
  "period_reports",
  {
    id: text("id").primaryKey(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id),
    periodType: text("period_type").notNull(),
    periodKey: text("period_key").notNull(),
    locale: text("locale").notNull().default("zh"),
    metricsJson: text("metrics_json").notNull(),
    narrativeJson: text("narrative_json").notNull(),
    model: text("model"),
    metricsHash: text("metrics_hash").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("period_reports_unique_idx").on(
      t.childId,
      t.periodType,
      t.periodKey,
      t.locale,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type SleepLog = typeof sleepLogs.$inferSelect;
