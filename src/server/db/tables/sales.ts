import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { client } from './client';
import { unit_department } from './department';
import { users } from './user-table';

export const sales = pgTable('sales', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  final_price: integer(),
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
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const salesRelations = relations(sales, ({ one }) => ({
  client: one(client, { fields: [sales.clientId], references: [client.id] }),
  unit: one(unit_department, {
    fields: [sales.unitId],
    references: [unit_department.id],
  }),
  seller: one(users, { fields: [sales.userId], references: [users.id] }),
}));
