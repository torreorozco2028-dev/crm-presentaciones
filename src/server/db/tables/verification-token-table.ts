import { sql } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const verificationTokens = pgTable(
  'verificationToken',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    email: varchar('email', { length: 256 }).notNull(),
    token: varchar('token', { length: 256 }).notNull(),
    expires: timestamp('expires').notNull(),
  },
  (table) => ({
    emailIdx: index('token_email_index').on(table.email),
    pk: index('token_identifier_index').on(table.email, table.token),
  })
);
