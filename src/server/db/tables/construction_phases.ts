import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, integer} from 'drizzle-orm/pg-core';
import { building } from './building';

export const construction_phases = pgTable('construction_phases', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  buildingId: uuid('building_id')
    .references(() => building.id)
    .notNull(),
  phase_name: varchar({ length: 50 }).notNull(),
  phase_description: text(),
  phase_date: varchar({ length: 50 }).notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const constructionPhasesRelations = relations(construction_phases, ({ one }) => ({
  building: one(building, {
    fields: [construction_phases.buildingId],
    references: [building.id],
  }),
}));
