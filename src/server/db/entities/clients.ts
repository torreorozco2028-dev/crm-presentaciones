import { db } from '../config';
import { client } from '../schema';
import { eq, sql, and, ilike, desc, or } from 'drizzle-orm';

type NewClient = typeof client.$inferInsert;
type ClientUpdate = Partial<typeof client.$inferSelect>;

export default class Client {
  async createClient(record: NewClient) {
    const [newClient] = await db.insert(client).values(record).returning();
    return newClient;
  }

  async batchInsertRecords(records: Array<NewClient>) {
    try {
      const newRecords = await db.insert(client).values(records).returning();
      return newRecords;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async searchClients(limit: number, offset: number, term?: string) {
    const whereClause = term
      ? or(
          ilike(client.names, `%${term}%`),
          ilike(client.first_last_name, `%${term}%`),
          ilike(client.email, `%${term}%`)
        )
      : undefined;

    return await db
      .select()
      .from(client)
      .where(whereClause)
      .limit(limit)
      .offset(offset);
  }

  async getClients(limit: number, offset: number, search?: string) {
    const whereClause = search
      ? or(
          ilike(client.names, `%${search}%`),
          ilike(client.first_last_name, `%${search}%`)
        )
      : undefined;

    return await db.query.client.findMany({
      where: whereClause,
      orderBy: [desc(client.updatedAt)],
      limit: limit,
      offset: (offset - 1) * limit,
    });
  }

  async getClientIds() {
    const records = await db.select({ id: client.id }).from(client);
    return records.map((r) => r.id);
  }

  async getClientById(id: string) {
    return await db.query.client.findFirst({
      where: eq(client.id, id),
    });
  }

  async updateClient(id: string, data: ClientUpdate) {
    await db
        .update(client)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(client.id, id));
    return { message: 'Client updated successfully' };
  }

  async getTotalRecords() {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(client);

    return Number(result?.count) || 0;
  }

  async deleteClientById(id: string) {
    return await db.delete(client).where(eq(client.id, id));
  }

  async editClientById(id: string, data: Partial<NewClient>) {
    return await db
      .update(client)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(client.id, id))
      .returning();
  }
}