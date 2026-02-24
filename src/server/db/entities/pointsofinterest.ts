import { db } from '../config';
import { points_interest } from '../schema';
import { type InferInsertModel, eq, desc } from 'drizzle-orm';

type NewPoint = InferInsertModel<typeof points_interest>;

export default class PointsOfInterestEntity {
  async createPointOfInterest(record: NewPoint) {
    try {
      const [insertedRecord] = await db
        .insert(points_interest)
        .values(record)
        .returning();
      return insertedRecord;
    } catch (error) {
      console.error('Error creating Point of Interest:', error);
      throw new Error('Failed to create point of interest');
    }
  }
  async getPointsByBuilding(buildingId: string) {
    return await db
      .select()
      .from(points_interest)
      .where(eq(points_interest.buildingId, buildingId))
      .orderBy(desc(points_interest.createdAt));
  }

  async getPointById(id: string) {
    const [point] = await db
      .select()
      .from(points_interest)
      .where(eq(points_interest.id, id))
      .limit(1);
    return point;
  }
  async deletePointOfInterest(id: string) {
    return await db
      .delete(points_interest)
      .where(eq(points_interest.id, id))
      .returning();
  }
}
