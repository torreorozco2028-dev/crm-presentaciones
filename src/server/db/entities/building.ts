import { db } from '../config';
import { building, general_features, building_to_features } from '../schema';
import { eq, sql, ilike, or, desc } from 'drizzle-orm';

type NewBuilding = typeof building.$inferInsert;
type BuildingUpdate = Partial<typeof building.$inferSelect>;
type NewFeature = typeof general_features.$inferInsert;

export default class BuildingEntity {
  async createBuilding(record: NewBuilding, featureIds: string[] = []) {
    return await db.transaction(async (tx) => {
      const [newBuilding] = await tx
        .insert(building)
        .values(record)
        .returning();

      if (featureIds.length > 0) {
        const relations = featureIds.map((fId) => ({
          buildingId: newBuilding.id,
          featureId: fId,
        }));
        await tx.insert(building_to_features).values(relations);
      }

      return newBuilding;
    });
  }

  async getBuildings(limit: number, page: number, search?: string) {
    const offset = (page - 1) * limit;
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
      orderBy: [desc(building.createdAt)],
      with: {
        buildingToFeatures: {
          with: {
            feature: true,
          },
        },
        pointsOfInterest: true,
        commonAreas: true,
      },
    });
  }

  async getBuildingsList() {
    return await db
      .select({ id: building.id, title: building.building_title })
      .from(building)
      .orderBy(building.building_title);
  }

  async getBuildingById(id: string) {
    return await db.query.building.findFirst({
      where: eq(building.id, id),
      with: {
        buildingToFeatures: {
          with: {
            feature: true,
          },
        },
        pointsOfInterest: true,
        commonAreas: true,
        salesStages: true,
        units: true,
        models: true,
      },
    });
  }

  async updateBuilding(
    id: string,
    data: BuildingUpdate,
    featureIds?: string[]
  ) {
    const oldRecord = await db.query.building.findFirst({
      where: eq(building.id, id),
    });

    const updated = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(building)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(building.id, id))
        .returning();

      if (featureIds !== undefined) {
        await tx
          .delete(building_to_features)
          .where(eq(building_to_features.buildingId, id));
        if (featureIds.length > 0) {
          const relations = featureIds.map((fId) => ({
            buildingId: id,
            featureId: fId,
          }));
          await tx.insert(building_to_features).values(relations);
        }
      }
      return res;
    });

    return { updated, oldRecord };
  }

  async deleteBuilding(id: string) {
    const [deleted] = await db
      .delete(building)
      .where(eq(building.id, id))
      .returning();
    return deleted;
  }

  async getAllFeatures() {
    return await db.query.general_features.findMany({
      orderBy: [desc(general_features.createdAt)],
    });
  }

  async createFeature(data: NewFeature) {
    const [feature] = await db
      .insert(general_features)
      .values(data)
      .returning();
    return feature;
  }

  async updateFeature(featureId: string, data: Partial<NewFeature>) {
    return await db
      .update(general_features)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(general_features.id, featureId))
      .returning();
  }

  async deleteFeature(featureId: string) {
    return await db
      .delete(general_features)
      .where(eq(general_features.id, featureId))
      .returning();
  }

  async getTotalBuildings() {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(building);
    return Number(result?.count) || 0;
  }
}
