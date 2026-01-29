'use server';
import { signInSchema, signUpSchema } from '@/schemas';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import User from '@/server/db/entities/user';
import { signIn } from '@/auth';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from '@/config/mail';
import VerificationToken from '@/server/db/entities/verificationToken';

const userEntity = new User();
const tokenEntity = new VerificationToken();

const createExpirationDate = () => new Date(new Date().getTime() + 3600 * 1000);

export async function registerUser(values: z.infer<typeof signUpSchema>) {
  const validatedFields = signUpSchema.safeParse(values);
  if (!validatedFields.success) return { error: 'Invalid Fields' };

  const { email, password, name } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await userEntity.getUserByEmail(email);
    if (existingUser) return { error: 'Email Already in use' };

    // Verify invitation token
    const isInvited = await tokenEntity.getVerificationTokenByEmail(email);
    if (!isInvited || new Date(isInvited.expires) < new Date()) {
      return { error: 'You were not invited or your invitation expired' };
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await userEntity.createUser({
      email,
      password: hashedPassword,
      name,
      emailVerified: new Date(),
      role: 'user',
      status: true,
      state: 'active',
    });
    await tokenEntity.deleteVerificationToken(isInvited.id);

    return { success: 'You were registered successfully!' };
  } catch (err) {
    console.error(err);
    return { error: "User couldn't be created" };
  }
}

export async function login(values: z.infer<typeof signInSchema>) {
  const validatedFields = signInSchema.safeParse(values);
  if (!validatedFields.success) return { error: 'Invalid Fields' };

  const { email, password } = validatedFields.data;

  try {
    const response = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid' };
        default:
          return {
            error: 'User is not registered. Please use a different email',
          };
      }
    }
    throw error;
  }
}

export async function invite(email: string) {
  try {
    const existingUser = await userEntity.getUserByEmail(email);
    if (existingUser) return { error: 'User already Registered!' };

    const existingToken = await tokenEntity.getVerificationTokenByEmail(email);
    let tokenString: string = '';

    if (existingToken) {
      const result: any = await tokenEntity.extendTokenExpiration(
        existingToken.email,
        createExpirationDate()
      );
      tokenString = Array.isArray(result) ? result[0].token : result.token;
    } else {
      const result: any = await tokenEntity.createVerificationToken({
        email,
        token: uuidv4(),
        expires: createExpirationDate(),
      });
      tokenString = Array.isArray(result) ? result[0].token : result.token;
    }

    if (!tokenString) throw new Error('Something went wrong');

    await sendInvitationEmail(email, tokenString);

    return { success: 'Invitation sent successfully...' };
  } catch (err: any) {
    console.error(err);
    return { error: 'Something went wrong' };
  }
}

export async function verificationToken(token: string) {
  try {
    const existingToken = await tokenEntity.getVerificationToken(token);

    if (!existingToken) return { error: 'The invitation is invalid' };

    if (new Date(existingToken.expires) < new Date()) {
      return { error: 'The invitation has expired' };
    }

    return { success: 'Invitation valid' };
  } catch {
    return { error: 'Something went wrong' };
  }
}
