'use server';

import { revalidatePath } from 'next/cache';
import ClientEntity from '@/server/db/entities/clients';
import { db } from '@/server/db/config';
import { unit_department, sales } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const clientEntity = new ClientEntity();

export async function registerClientAction(formData: any) {
  try {
    const newClient = await clientEntity.createClient({
      names: formData.names,
      first_last_name: formData.first_last_name,
      second_last_name: formData.second_last_name,
      type_document: formData.type_document,
      n_document: Number(formData.n_document),
      email: formData.email,
      cellphone: Number(formData.cellphone),
      location: formData.location,
      genre: formData.genre,
      marital_status: formData.marital_status,
      occupation: formData.occupation,
    });

    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error registering client:', error);
    return { success: false, error: 'No se pudo registrar el cliente' };
  }
}