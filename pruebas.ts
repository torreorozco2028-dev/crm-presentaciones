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

// Helper function to create token expiration date (1 hour from now)
const createExpirationDate = () => new Date(new Date().getTime() + 3600 * 1000);

export async function registerUser(values: z.infer<typeof signUpSchema>) {
  const validatedFields = signUpSchema.safeParse(values);
  if (!validatedFields.success) return { error: 'Invalid Fields' };

  const { email, password, name } = validatedFields.data;

  // Check if user already exists
  const existingUser = await userEntity.getUserByEmail(email);
  if (existingUser) throw new Error('Email Already in use');

  // Verify invitation token
  const isInvited = await tokenEntity.getVerificationTokenByEmail(email);
  if (!isInvited || isInvited.expires < new Date())
    throw new Error('You were not invited or your invitation expired');

  try {
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await userEntity.createUser({
      email,
      password: hashedPassword,
      name,
      emailVerified: new Date(),
    });

    // Delete the verification token
    await tokenEntity.deleteVerificationToken(isInvited.id);

    return { success: 'You were registered successfully!' };
  } catch (err) {
    console.error(err);
    throw new Error("User couldn't be created");
  }
}

export async function login(values: z.infer<typeof signInSchema>) {
  const validatedFields = signInSchema.safeParse(values);
  if (!validatedFields.success) throw new Error('Invalid Fields');

  const { email, password } = validatedFields.data;

  // Check if user exists
  const existingUser = await userEntity.getUserByEmail(email);
  if (!existingUser?.email || !existingUser?.password) {
    throw new Error('User is not registered. Please use a different email');
  }

  try {
    const response = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (response?.error) throw new Error(response.error);
    return response;
  } catch (error) {
    console.error(error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          throw new Error(
            'Invalid credentials. Try a different email/password'
          );
        default:
          throw new Error('Something went wrong');
      }
    }
    throw error;
  }
}

export async function invite(email: string) {
  // Check if user already exists
  const existingUser = await userEntity.getUserByEmail(email);
  if (existingUser) throw new Error('User already Registered!');

  // Check for existing token
  const existingToken = await tokenEntity.getVerificationTokenByEmail(email);

  try {
    let token;

    if (existingToken) {
      // Extend existing token
      token = await tokenEntity.extendTokenExpiration(
        existingToken.email,
        createExpirationDate()
      );
    } else {
      // Create new token
      token = await tokenEntity.createVerificationToken({
        email,
        token: uuidv4(),
        expires: createExpirationDate(),
      });
    }

    // Send invitation email
    await sendInvitationEmail(email, token[0].token);

    return 'Invitation sent successfully...';
  } catch (err: any) {
    throw new Error(err);
  }
}

export async function verificationToken(token: string) {
  const existingToken = await tokenEntity.getVerificationToken(token);

  if (!existingToken) return { error: 'The invitation is invalid' };
  if (existingToken.expires < new Date())
    return { error: 'The invitation has expired' };

  return { success: 'Invitation is Valid' };
}
