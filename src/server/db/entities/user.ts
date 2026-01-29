import { db } from '../config';
import { users } from '../schema';
import { eq, sql, and, ilike, desc, or } from 'drizzle-orm';

type NewUser = typeof users.$inferInsert;
type UserUpdate = Partial<typeof users.$inferSelect>;

export default class User {
  async createUser(record: NewUser) {
    const [newUser] = await db.insert(users).values(record).returning();
    return newUser;
  }
  async batchInsertRecords(records: Array<NewUser>) {
    try {
      const newRecord = await db.insert(users).values(records).returning();
      return newRecord;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getUserFirstUser() {
    try {
      const record = await db.query.users.findFirst({
        with: { profile: true },
      });

      return record;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async searchUsers(limit: number, offset: number, term?: string) {
    const whereClause = term
      ? or(ilike(users.name, `%${term}%`), ilike(users.email, `%${term}%`))
      : undefined;

    return await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset);
  }

  async getUsers(limit: number, offset: number, search?: string) {
    const whereClause = search
      ? and(eq(users.status, true), ilike(users.name, `%${search}%`))
      : eq(users.status, true);

    return await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        state: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
      },
      where: whereClause,
      orderBy: [desc(users.updatedAt)],
      limit: limit,
      offset: (offset - 1) * limit,
    });
  }

  async getUserIds() {
    const records = await db.select({ id: users.id }).from(users);
    return records.map((r) => r.id);
  }

  async getUserByEmail(email: string) {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async getUserById(id: string) {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async updateUser(id: string, data: UserUpdate) {
    await db.update(users).set(data).where(eq(users.id, id));
    return { message: 'Updated successfully' };
  }

  async toggleBlockStatus(id: string, isBlocked: boolean) {
    return await this.updateUser(id, {
      status: !isBlocked,
      blocked: isBlocked,
      state: isBlocked ? 'Blocked' : 'active',
    });
  }

  async resetPasswordByEmail(email: string, passwordHash: string) {
    await db
      .update(users)
      .set({ password: passwordHash })
      .where(eq(users.email, email));

    return { message: 'Su contraseña ha sido restaurada' };
  }

  async getTotalRecords() {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.status, true));

    return Number(result?.count) || 0;
  }

  async deleteUserById(id: string) {
    return await db.delete(users).where(eq(users.id, id));
  }
  async editUserById(id: string, data: Partial<typeof users.$inferInsert>) {
    return await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
  }
}
