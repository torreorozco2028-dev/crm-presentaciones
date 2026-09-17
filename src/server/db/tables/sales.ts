import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
} from 'drizzle-orm/pg-core';
import { client } from './client';
import { unit_department } from './department';
import { users } from './user-table';

export const sales = pgTable('sales', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  final_price: numeric('final_price', {
    precision: 12,
    scale: 2,
    mode: 'number',
  }),
  // ISO currency code the price/advance are denominated in ('BOB' or 'USD').
  // Nullable so pre-existing rows (created before multi-currency support) keep working; the app treats a null value as 'BOB'.
  currency: varchar({ length: 3 }),
  // Exchange rate the sale was priced at, only meaningful when currency !== 'BOB'.
  exchangeRate: numeric('exchange_rate', {
    precision: 10,
    scale: 4,
    mode: 'number',
  }),
  advance_percentage: integer(),
  // 'percentage' | 'amount'. Nullable for pre-existing rows, treated as 'percentage' when null.
  advanceType: varchar('advance_type', { length: 20 }),
  advanceAmount: numeric('advance_amount', {
    precision: 12,
    scale: 2,
    mode: 'number',
  }),
  sales_date: timestamp().default(sql`now()`),
  payment_method: varchar({ length: 50 }),
  payment_notes: text(),
  clientId: uuid('client_id')
    .references(() => client.id)
    .notNull(),
  unitId: uuid('unit_id')
    .references(() => unit_department.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const salesRelations = relations(sales, ({ one }) => ({
  client: one(client, { fields: [sales.clientId], references: [client.id] }),
  unit: one(unit_department, {
    fields: [sales.unitId],
    references: [unit_department.id],
  }),
  seller: one(users, {
    fields: [sales.userId],
    references: [users.id],
    relationName: 'salesCreator',
  }),
  lastUpdatedBy: one(users, {
    fields: [sales.updatedByUserId],
    references: [users.id],
    relationName: 'salesLastUpdatedBy',
  }),
}));
