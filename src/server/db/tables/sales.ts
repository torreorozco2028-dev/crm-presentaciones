import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
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
  // Tipo de cambio (Bs por USD) propio del anticipo; si es null se usa exchangeRate.
  advanceExchangeRate: numeric('advance_exchange_rate', {
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
  // Campos del control de ventas (planilla): todos opcionales para ventas previas.
  seller_agency: varchar({ length: 100 }),
  has_commission: boolean('has_commission').notNull().default(false),
  has_installments: boolean('has_installments').notNull().default(false),
  payment_frequency: varchar({ length: 50 }),
  installments_percentage: integer(),
  global_percentage: numeric('global_percentage', {
    precision: 5,
    scale: 2,
    mode: 'number',
  }),
  sales_expense_percentage: numeric('sales_expense_percentage', {
    precision: 5,
    scale: 2,
    mode: 'number',
  }),
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

export const salesRelations = relations(sales, ({ one, many }) => ({
  payments: many(sale_payments),
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

export const sale_payments = pgTable('sale_payments', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  saleId: uuid('sale_id')
    .references(() => sales.id, { onDelete: 'cascade' })
    .notNull(),
  amount: numeric('amount', {
    precision: 12,
    scale: 2,
    mode: 'number',
  }).notNull(),
  // Moneda y tipo de cambio (Bs por USD) de cada pago; null = los de la venta.
  currency: varchar({ length: 3 }),
  exchangeRate: numeric('exchange_rate', {
    precision: 10,
    scale: 4,
    mode: 'number',
  }),
  paid_at: timestamp('paid_at')
    .default(sql`now()`)
    .notNull(),
  note: text(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
});

export const salePaymentsRelations = relations(sale_payments, ({ one }) => ({
  sale: one(sales, { fields: [sale_payments.saleId], references: [sales.id] }),
}));
