import { db } from '../config';
import { building_news } from '../schema';
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  type InferInsertModel,
} from 'drizzle-orm';

type NewBuildingNews = InferInsertModel<typeof building_news>;
type UpdateBuildingNews = Partial<Omit<NewBuildingNews, 'buildingId'>>;

export default class BuildingNewsEntity {
  async createNews(record: NewBuildingNews) {
    const [created] = await db.insert(building_news).values(record).returning();
    return created;
  }

  async getNewsPageByBuilding(
    buildingId: string,
    limit: number,
    offset: number
  ) {
    const where = eq(building_news.buildingId, buildingId);
    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(building_news)
        .where(where)
        .orderBy(desc(building_news.news_date), desc(building_news.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(building_news).where(where),
    ]);
    return { items, total };
  }

  /** Una pagina de noticias publicadas, con el ultimo avance de obra cargado. */
  async getPublishedNewsPage(
    buildingId: string,
    limit: number,
    offset: number
  ) {
    const where = and(
      eq(building_news.buildingId, buildingId),
      eq(building_news.is_published, true)
    );
    const [items, [{ total }], latest] = await Promise.all([
      db
        .select({
          id: building_news.id,
          title: building_news.title,
          body: building_news.body,
          news_date: building_news.news_date,
          batch_images: building_news.batch_images,
          video_url: building_news.video_url,
          video_thumbnail_url: building_news.video_thumbnail_url,
          progress_percent: building_news.progress_percent,
          show_progress: building_news.show_progress,
          title_color: building_news.title_color,
        })
        .from(building_news)
        .where(where)
        .orderBy(desc(building_news.news_date), desc(building_news.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(building_news).where(where),
      db
        .select({ progress: building_news.progress_percent })
        .from(building_news)
        .where(
          and(
            where,
            eq(building_news.show_progress, true),
            isNotNull(building_news.progress_percent)
          )
        )
        .orderBy(desc(building_news.news_date), desc(building_news.createdAt))
        .limit(1),
    ]);
    return { items, total, latestProgress: latest[0]?.progress ?? null };
  }

  async getNewsById(id: string) {
    const [news] = await db
      .select()
      .from(building_news)
      .where(eq(building_news.id, id))
      .limit(1);
    return news;
  }

  async updateNews(id: string, data: UpdateBuildingNews) {
    const [updated] = await db
      .update(building_news)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(building_news.id, id))
      .returning();
    return updated;
  }

  async deleteNews(id: string) {
    return await db
      .delete(building_news)
      .where(eq(building_news.id, id))
      .returning();
  }
}
