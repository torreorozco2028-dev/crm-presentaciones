import { db } from '../config';
import { verificationTokens } from '../schema';
import { eq } from 'drizzle-orm';

type NewVerificationToken = typeof verificationTokens.$inferInsert;

export default class VerificationToken {
  /**
   * Creates a new verification token
   */
  async createVerificationToken(record: NewVerificationToken) {
    try {
      const token = await db
        .insert(verificationTokens)
        .values(record)
        .returning({ token: verificationTokens.token });
      return token;
    } catch (err) {
      console.error('Failed to create verification token:', err);
      throw err;
    }
  }

  /**
   * Finds a verification token by email
   */
  async getVerificationTokenByEmail(email: string) {
    try {
      return await db.query.verificationTokens.findFirst({
        where: eq(verificationTokens.email, email),
      });
    } catch (err) {
      console.error('Failed to get verification token by email:', err);
      throw err;
    }
  }

  /**
   * Updates the expiration date of a token
   */
  async extendTokenExpiration(email: string, expires: Date) {
    try {
      const record = await db
        .update(verificationTokens)
        .set({ expires })
        .where(eq(verificationTokens.email, email))
        .returning({ token: verificationTokens.token });
      return record;
    } catch (err) {
      console.error('Failed to extend token expiration:', err);
      throw err;
    }
  }

  /**
   * Finds a verification token by token string
   */
  async getVerificationToken(token: string) {
    try {
      return await db.query.verificationTokens.findFirst({
        where: eq(verificationTokens.token, token),
      });
    } catch (err) {
      console.error('Failed to get verification token:', err);
      throw err;
    }
  }

  /**
   * Deletes a verification token by id
   */
  async deleteVerificationToken(id: string) {
    try {
      await db.delete(verificationTokens).where(eq(verificationTokens.id, id));
      return 'Token deleted successfully';
    } catch (err) {
      console.error('Failed to delete verification token:', err);
      throw err;
    }
  }
}
