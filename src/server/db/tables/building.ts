import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { department_model } from './department';
import { common_areas } from './common_areas';
import { construction_phases } from './construction_phases';
import { points_interest } from './pointsofinterest';
import { sales_stages } from './sales_stages';

export const general_features = pgTable('general_features', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  name_gfeatures: varchar('name_gfeatures', { length: 100 }).notNull(),
  room: varchar({ length: 50 }),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const building = pgTable('building', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  building_title: varchar({ length: 100 }).notNull(),
  building_description: text(),
  building_location: varchar({ length: 255 }),
  plan_image: varchar({ length: 255 }),
  prymary_image: varchar({ length: 255 }),
  total_floors: integer(),
  number_garages: integer(),
  number_storages: integer(),
  batch_images: jsonb().default([]),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const building_to_features = pgTable(
  'building_to_features',
  {
    buildingId: uuid('building_id')
      .notNull()
      .references(() => building.id, { onDelete: 'cascade' }),
    featureId: uuid('feature_id')
      .notNull()
      .references(() => general_features.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.buildingId, t.featureId] }),
  })
);

export const buildingRelations = relations(building, ({ many }) => ({
  buildingToFeatures: many(building_to_features),
  models: many(department_model),
  commonAreas: many(common_areas),
  constructionPhases: many(construction_phases),
  pointsOfInterest: many(points_interest),
  salesStages: many(sales_stages),
}));

export const generalFeaturesRelations = relations(
  general_features,
  ({ many }) => ({
    buildingToFeatures: many(building_to_features),
  })
);

export const buildingToFeaturesRelations = relations(
  building_to_features,
  ({ one }) => ({
    building: one(building, {
      fields: [building_to_features.buildingId],
      references: [building.id],
    }),
    feature: one(general_features, {
      fields: [building_to_features.featureId],
      references: [general_features.id],
    }),
  })
);
