'use server';

import User from '@/server/db/entities/user';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const entity = new User();

const UserUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  role: z.string(),
  status: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
});

export async function searchUsers(
  limit: number,
  offset: number,
  term?: string
) {
  return await entity.searchUsers(limit, offset, term);
}

export async function getUsers() {
  try {
    return await entity.getUsers(10, 1);
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function updateUser(formData: FormData) {
  try {
    const validatedFields = UserUpdateSchema.parse({
      id: formData.get('id'),
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      status: formData.get('status'),
    });

    const { id, ...data } = validatedFields;

    await entity.editUserById(id, {
      ...data,
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to update user' };
  }
}

export async function deleteUser(id: string) {
  try {
    await entity.deleteUserById(id);
    revalidatePath('/users');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to delete user' };
  }
}

export async function getTotalUsers() {
  try {
    return await entity.getTotalRecords();
  } catch (err) {
    console.error(err);
    return 0;
  }
}
