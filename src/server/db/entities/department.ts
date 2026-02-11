import { db } from '../config';
import {
  department_model,
  unit_department,
  department_features,
  modelToFeatures,
} from '../schema';
import { eq, desc } from 'drizzle-orm';

type NewModel = typeof department_model.$inferInsert;
type ModelUpdate = Partial<NewModel>;
type NewUnit = typeof unit_department.$inferInsert;
type UnitUpdate = Partial<NewUnit>;
type NewFeature = typeof department_features.$inferInsert;

export default class DepartmentEntity {
  //DEPARTMENTMODEL

  //para probar lo del svg
  async quickCreateModel(buildingId: string, id_plan: string) {
    const [model] = await db
      .insert(department_model)
      .values({
        buildingId,
        id_plan,
      })
      .returning();
    return model;
  }

  async createModel(record: NewModel, featureIds: string[] = []) {
    return await db.transaction(async (tx) => {
      const [newModel] = await tx
        .insert(department_model)
        .values(record)
        .returning();

      if (featureIds.length > 0) {
        const relations = featureIds.map((fId) => ({
          modelId: newModel.id,
          featureId: fId,
        }));
        await tx.insert(modelToFeatures).values(relations);
      }
      return newModel;
    });
  }

  async getModelsByBuilding(buildingId: string) {
    return await db.query.department_model.findMany({
      where: eq(department_model.buildingId, buildingId),
      with: {
        units: true,
      },
      orderBy: [desc(department_model.createdAt)],
    });
  }

  async updateModel(id: string, data: ModelUpdate, featureIds?: string[]) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(department_model)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(department_model.id, id))
        .returning();

      if (featureIds !== undefined) {
        await tx.delete(modelToFeatures).where(eq(modelToFeatures.modelId, id));
        if (featureIds.length > 0) {
          const relations = featureIds.map((fId) => ({
            modelId: id,
            featureId: fId,
          }));
          await tx.insert(modelToFeatures).values(relations);
        }
      }
      return updated;
    });
  }

  async deleteModel(id: string) {
    const [deleted] = await db
      .delete(department_model)
      .where(eq(department_model.id, id))
      .returning();
    return deleted;
  }

  //DEPARTMENT UNITS

  async createUnit(record: NewUnit) {
    const [unit] = await db.insert(unit_department).values(record).returning();
    return unit;
  }

  async getUnitsByModel(modelId: string) {
    return await db.query.unit_department.findMany({
      where: eq(unit_department.modelId, modelId),
      orderBy: [unit_department.floor, unit_department.unit_number],
    });
  }

  async updateUnit(id: string, data: UnitUpdate) {
    const [updated] = await db
      .update(unit_department)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(unit_department.id, id))
      .returning();
    return updated;
  }

  async deleteUnit(id: string) {
    return await db
      .delete(unit_department)
      .where(eq(unit_department.id, id))
      .returning();
  }

  //DEPARTMENT FEATURES
  async getAllFeatures() {
    return await db.select().from(department_features);
  }

  async createFeature(data: NewFeature) {
    const [feature] = await db
      .insert(department_features)
      .values(data)
      .returning();
    return feature;
  }

  async deleteFeature(id: string) {
    return await db
      .delete(department_features)
      .where(eq(department_features.id, id))
      .returning();
  }
}
