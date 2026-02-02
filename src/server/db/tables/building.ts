import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
} from 'drizzle-orm/pg-core';
import { department_model } from './department';
import { common_areas } from './common_areas';

export const building = pgTable(
  'building',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    building_title: varchar({ length: 100 }).notNull(), 
    building_description: text(),
    building_location: varchar({ length: 256 }).notNull(),
    building_plan_url: varchar({ length: 256 }).notNull(),
    primary_image: varchar({ length: 256 }).notNull(),
    total_floors: integer().notNull(),
    n_garages: integer("number_garages").notNull(),
    n_storages: integer("number_storages").notNull(),
    batch_images: text(),
  },
);

export const general_features = pgTable(
  'general_features',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    buildingId: uuid('building_id').references(() => building.id).notNull(),
    name_gfeatures: varchar('general_features_name', { length: 100 }).notNull(),
    room: varchar({ length: 50 }),
  },
);

export const buildingRelations = relations(building, ({ many }) => ({
  models: many(department_model),
  commonAreas: many(common_areas),
  generalFeatures: many(general_features),
}));