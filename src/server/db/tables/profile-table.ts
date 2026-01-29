import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './user-table';

export const profiles = pgTable(
  'profile',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    firstName: varchar('first_name', { length: 256 }).notNull(),
    lastName: varchar('last_name', { length: 256 }).notNull(),
    cellphone: varchar('cellphone', { length: 256 }).notNull(),
    telephone: varchar('telephone', { length: 256 }),
    mainAddress: varchar('main_address', { length: 256 }).notNull(),
    secondAddress: varchar('second_address', { length: 256 }),
    status: boolean('status').default(true),
    createdAt: timestamp('created_at').default(sql`now()`),
    updatedAt: timestamp('updated_at').default(sql`now()`),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    firstNameIdx: index('profiles_first_name_index').on(table.firstName),
    lastNameIdx: index('profiles_last_name_index').on(table.lastName),
    cellPhoneIdx: index('profiles_cellphone_index').on(table.cellphone),
    telephoneIdx: index('profiles_telephone_index').on(table.telephone),
  })
);
