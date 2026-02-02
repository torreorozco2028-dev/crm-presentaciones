import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { building } from './building';
import { rooms_model } from './rooms_model';

export const department_model = pgTable(
  'department_model',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    buildingId: uuid('building_id').references(() => building.id).notNull(),
    department_model_id: varchar({ length: 100 }), 
    base_square_meters: integer(),
    balcony:boolean().default(false), //tiene o no balcon
    id_plan: varchar({ length: 256 }).notNull(),
    batch_images: text(),
  },
);

export const department_features = pgTable(
  'department_features',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    dfeatures_name: varchar('department_features_name', { length: 100 }).notNull(),
  },
);

export const modelToFeatures = pgTable('model_to_features', {
  modelId: uuid('model_id').references(() => department_model.id).notNull(),
  featureId: uuid('features_id').references(() => department_features.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.modelId, t.featureId] }),
}));

export const departmentModelRelations = relations(department_model, ({ one, many }) => ({
  building: one(building, { fields: [department_model.buildingId], references: [building.id] }),
  rooms: many(rooms_model),
  features: many(modelToFeatures),
}));