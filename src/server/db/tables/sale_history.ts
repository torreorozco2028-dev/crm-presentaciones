import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { sales } from './sales';
import { users } from './user-table';

export const sale_history = pgTable('sale_history', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  saleId: uuid('sale_id')
    .references(() => sales.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  // 'system' for automatic change logs, 'comment' for manual notes added by admin/creator.
  type: varchar('type', { length: 20 }).notNull().default('system'),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
});

export const saleHistoryRelations = relations(sale_history, ({ one }) => ({
  sale: one(sales, {
    fields: [sale_history.saleId],
    references: [sales.id],
  }),
  user: one(users, {
    fields: [sale_history.userId],
    references: [users.id],
  }),
}));
