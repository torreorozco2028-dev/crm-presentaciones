import { db } from '../config';
import { building, general_features } from '../schema';
import { eq, sql, ilike, or, desc } from 'drizzle-orm';

type NewBuilding = typeof building.$inferInsert;
type BuildingUpdate = Partial<typeof building.$inferSelect>;
type NewFeature = typeof general_features.$inferInsert;

export default class BuildingEntity {
  // CRUD EDIFICIO

  async createBuilding(record: NewBuilding) {
    const [newBuilding] = await db.insert(building).values(record).returning();
    return newBuilding;
  }

  async getBuildings(limit: number, page: number, search?: string) {
    const offset = (page - 1) * limit;
    //filtros
    const whereClause = search
      ? or(
          ilike(building.building_title, `%${search}%`),
          ilike(building.building_location, `%${search}%`)
        )
      : undefined;

    return await db.query.building.findMany({
      where: whereClause,
      limit: limit,
      offset: offset,
      orderBy: [desc(building.id)],
    });
  }

  async getBuildingById(id: string) {
    return await db.query.building.findFirst({
      where: eq(building.id, id),
      with: {
        generalFeatures: true,
      },
    });
  }

  async updateBuilding(id: string, data: BuildingUpdate) {
    const [updated] = await db
      .update(building)
      .set(data)
      .where(eq(building.id, id))
      .returning();
    return updated;
  }

  async deleteBuilding(id: string) {
    return await db.delete(building).where(eq(building.id, id));
  }

  // CRUD GENERAL FEATURES

  async addFeaturesToBuilding(features: NewFeature[]) {
    return await db.insert(general_features).values(features).returning();
  }

  async updateFeature(featureId: string, data: Partial<NewFeature>) {
    return await db
      .update(general_features)
      .set(data)
      .where(eq(general_features.id, featureId))
      .returning();
  }

  async deleteFeature(featureId: string) {
    return await db
      .delete(general_features)
      .where(eq(general_features.id, featureId));
  }

  async getTotalBuildings() {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(building);
    return Number(result?.count) || 0;
  }
}
