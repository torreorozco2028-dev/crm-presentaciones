import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { building } from './building';

export const building_news = pgTable(
  'building_news',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    buildingId: uuid('building_id')
      .references(() => building.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar({ length: 150 }).notNull(),
    body: text(),
    news_date: date('news_date').notNull(),
    batch_images: jsonb().default([]),
    video_url: varchar({ length: 255 }),
    video_thumbnail_url: varchar({ length: 500 }),
    progress_percent: integer(),
    show_progress: boolean('show_progress').notNull().default(true),
    title_color: varchar({ length: 20 }),
    is_published: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at').default(sql`now()`),
    updatedAt: timestamp('updated_at').default(sql`now()`),
  },
  (t) => [
    index('building_news_building_published_date_idx').on(
      t.buildingId,
      t.is_published,
      t.news_date
    ),
  ]
);

export const buildingNewsRelations = relations(building_news, ({ one }) => ({
  building: one(building, {
    fields: [building_news.buildingId],
    references: [building.id],
  }),
}));
