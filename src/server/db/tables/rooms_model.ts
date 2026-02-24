import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { department_model } from './department';

export const rooms_model = pgTable('rooms_model', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  modelId: uuid('model_id')
    .references(() => department_model.id)
    .notNull(),
  room_name: varchar({ length: 100 }).notNull(),
  room_type: varchar({ length: 256 }),
  square_meters: integer(),
});

export const roomsRelations = relations(rooms_model, ({ one }) => ({
  model: one(department_model, {
    fields: [rooms_model.modelId],
    references: [department_model.id],
  }),
}));
