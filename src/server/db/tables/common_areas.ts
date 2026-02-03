import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { building } from './building';

export const common_areas = pgTable('common_areas', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  buildingId: uuid('building_id')
    .references(() => building.id)
    .notNull(),
  common_area_name: varchar({ length: 100 }).notNull(),
  common_area_description: text(),
  batch_images: text(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const commonAreasRelations = relations(common_areas, ({ one }) => ({
  building: one(building, {
    fields: [common_areas.buildingId],
    references: [building.id],
  }),
}));
