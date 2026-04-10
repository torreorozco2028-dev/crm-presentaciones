import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sales } from './sales';
import { users } from './user-table';

export const client = pgTable('client', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  names: varchar({ length: 50 }).notNull(),
  first_last_name: varchar({ length: 30 }).notNull(),
  second_last_name: varchar({ length: 30 }),
  type_document: varchar({ length: 50 }).notNull(),
  n_document: integer('number_of_document'),
  email: varchar({ length: 50 }),
  cellphone: integer(),
  location: text(),
  genre: varchar({ length: 30 }),
  marital_status: varchar({ length: 50 }),
  occupation: varchar({ length: 50 }),
  userId: uuid('user_id').references(() => users.id),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const clientRelations = relations(client, ({ many, one }) => ({
  sales: many(sales),
  owner: one(users, { fields: [client.userId], references: [users.id] }),
  lastUpdatedBy: one(users, {
    fields: [client.updatedByUserId],
    references: [users.id],
  }),
}));
