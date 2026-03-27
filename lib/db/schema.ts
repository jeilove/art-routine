import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  varchar,
} from 'drizzle-orm/pg-core';
import { type AdapterAccount } from 'next-auth/adapters';

// --- Auth.js Tables (Required by Drizzle Adapter) ---
export const users = pgTable('user', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  startDate: text('startDate'), // 루틴 시작일 (YYYY-MM-DD)
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [
    {
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    }
  ]
);

// --- Business Logic Tables (Habits, Routines) ---

export const habits = pgTable('habit', {
  id: text('id').primaryKey(), // Frontend에서 생성한 UUID 또는 ID 유지
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  inputType: varchar('inputType', { length: 20 }).notNull(), // 'binary' | 'percent'
  order: integer('order').notNull().default(0),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const dailyData = pgTable('daily_data', {
  id: serial('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dateStr: varchar('dateStr', { length: 10 }).notNull(), // 'YYYY-MM-DD'
  dayNum: integer('dayNum').notNull(), // 1~30
  memo: text('memo'),
  mood: text('mood'),
  habitSnapshot: jsonb('habitSnapshot'), // 기록 시점의 습관 목록 스냅샷 (배열)
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const dailyLogs = pgTable('daily_log', {
  id: serial('id').primaryKey(),
  dailyDataId: integer('dailyDataId')
    .notNull()
    .references(() => dailyData.id, { onDelete: 'cascade' }),
  habitId: text('habitId').notNull(), // habits.id와 매핑
  value: integer('value').notNull(), // 0~100
});

import { relations } from 'drizzle-orm';

export const dailyDataRelations = relations(dailyData, ({ many }) => ({
  logs: many(dailyLogs),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  dailyData: one(dailyData, {
    fields: [dailyLogs.dailyDataId],
    references: [dailyData.id],
  }),
}));
