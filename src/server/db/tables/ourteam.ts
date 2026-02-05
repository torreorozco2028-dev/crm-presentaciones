import {sql } from 'drizzle-orm';
import {pgTable, uuid, varchar, boolean, timestamp} from 'drizzle-orm/pg-core';


export const ourteam = pgTable('ourteam', {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    names: varchar({ length: 50 }).notNull(),
    last_names: varchar({length: 50}).notNull(),
    position: varchar({length: 50}),
    photo: varchar({length: 255}).notNull(),
    is_active: boolean(),
    createdAt: timestamp('created_at').default(sql`now()`),
    updatedAt: timestamp('updated_at').default(sql`now()`),
  },
);