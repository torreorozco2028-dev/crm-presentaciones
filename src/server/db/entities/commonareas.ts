import { db } from '../config';
import { common_areas } from '../schema';
import { eq, desc, type InferInsertModel } from 'drizzle-orm';

type NewCommonArea = InferInsertModel<typeof common_areas>;

export default class CommonAreasEntity {
  async createCommonArea(record: NewCommonArea) {
    try {
      const [newArea] = await db
        .insert(common_areas)
        .values(record)
        .returning();
      return newArea;
    } catch (error) {
      console.error('Error creating Common Area:', error);
      throw new Error('Could not create common area');
    }
  }

  async getCommonAreasByBuilding(buildingId: string) {
    return await db
      .select()
      .from(common_areas)
      .where(eq(common_areas.buildingId, buildingId))
      .orderBy(desc(common_areas.createdAt));
  }

  async getCommonAreaById(id: string) {
    const [area] = await db
      .select()
      .from(common_areas)
      .where(eq(common_areas.id, id))
      .limit(1);
    return area;
  }

  async deleteCommonArea(id: string) {
    return await db
      .delete(common_areas)
      .where(eq(common_areas.id, id))
      .returning();
  }
}
