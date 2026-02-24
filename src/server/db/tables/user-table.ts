import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
  text,
} from 'drizzle-orm/pg-core';
import { profiles } from './profile-table';
import { sales } from './sales';

export const users = pgTable(
  'user',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    name: text('name'),
    email: varchar('email', { length: 256 }).notNull().unique(),
    password: varchar('password', { length: 256 }).notNull(),
    state: varchar('state', { length: 256 }).default('active').notNull(),
    status: boolean('status').default(true),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    role: varchar('role', { length: 256 }).default('user'),
    blocked: boolean('blocked').default(false),
    createdAt: timestamp('created_at').default(sql`now()`),
    updatedAt: timestamp('updated_at').default(sql`now()`),
  },
  (table) => ({
    emailIdx: index('user_email_index').on(table.email),
  })
);

export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sales: many(sales),
}));
