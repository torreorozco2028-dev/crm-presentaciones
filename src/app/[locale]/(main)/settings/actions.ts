'use server';
import { auth } from '@/auth';
import { db } from '@/server/db/config';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { uploadSingleImage, deleteFilesFromStorage } from '@/services/storage';

type UpdateUserData = {
  name?: string;
  password?: string;
  image?: string;
};

export async function getUserProfile() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return null;
    }

    return user[0];
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(
  data: UpdateUserData,
  formData?: FormData
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = session.user.id;
    const updateData: Record<string, any> = {};
    if (formData && formData.has('upload')) {
      const file = formData.get('upload') as File;

      if (file && file.size > 0) {
        const currentUser = await getUserProfile();
        const newImageUrl = await uploadSingleImage(file);
        updateData.image = newImageUrl;

        if (
          currentUser?.image &&
          currentUser.image.includes('public.blob.vercel-storage.com')
        ) {
          await deleteFilesFromStorage(currentUser.image);
        }
      }
    }

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No data to update');
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, image: users.image });

    if (!updatedUser || updatedUser.length === 0) {
      throw new Error('Failed to update user');
    }

    revalidatePath('/launch');
    return updatedUser[0];
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
