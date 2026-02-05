import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { building } from './building';

export const sales_stages = pgTable('sales_stages', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  buildingId: uuid('building_id')
    .references(() => building.id)
    .notNull(),
  stage_type: varchar({ length: 50 }).notNull(),
  price: integer(),
  stage_description: text(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const salesStagesRelations = relations(sales_stages, ({ one }) => ({
  building: one(building, {
    fields: [sales_stages.buildingId],
    references: [building.id],
  }),
}));
