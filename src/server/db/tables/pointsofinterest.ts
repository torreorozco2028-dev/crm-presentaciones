import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { building } from './building';

export const points_interest = pgTable('points_of_interest', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  buildingId: uuid('building_id')
    .references(() => building.id)
    .notNull(),
  point_name: varchar({ length: 100 }).notNull(),
  point_description: text(),
  point_distance: integer(),
  lat: varchar({ length: 255 }),
  lon: varchar({ length: 255 }),
  //batch_images: text(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const pointsInterestRelations = relations(
  points_interest,
  ({ one }) => ({
    building: one(building, {
      fields: [points_interest.buildingId],
      references: [building.id],
    }),
  })
);
