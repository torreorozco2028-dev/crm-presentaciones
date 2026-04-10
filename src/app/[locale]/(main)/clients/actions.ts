'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/server/db/config';
import { client } from '@/server/db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

function isAdminRole(role: unknown) {
  return String(role ?? '').toLowerCase() === 'admin';
}

function toOptionalText(value: unknown) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function toOptionalInteger(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;

  return Math.trunc(parsed);
}

function normalizePage(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function buildClientWhere(search?: string) {
  const query = search?.trim();
  if (!query) return undefined;

  const likeQuery = `%${query}%`;
  return and(
    or(
      ilike(client.names, likeQuery),
      ilike(client.first_last_name, likeQuery),
      ilike(client.second_last_name, likeQuery),
      ilike(client.email, likeQuery),
      ilike(client.location, likeQuery),
      ilike(client.occupation, likeQuery)
    )
  );
}

export async function getClientsSetupAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para ver los clientes',
      };
    }

    return {
      success: true,
      data: {
        currentUserId: session.user.id,
        currentUserRole: String(session.user.role ?? ''),
      },
    };
  } catch (error) {
    console.error('Error loading clients setup:', error);
    return { success: false, error: 'No se pudo cargar la configuración' };
  }
}

interface GetClientsListInput {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getClientsListAction(input: GetClientsListInput = {}) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;
    const canManageAnyClient = isAdminRole(session?.user?.role);

    if (!currentUserId) {
      return {
        success: false,
        error: 'Debes iniciar sesión para ver los clientes',
      };
    }

    const page = normalizePage(input.page, 1);
    const pageSize = Math.min(50, normalizePage(input.pageSize, 10));
    const offset = (page - 1) * pageSize;
    const whereClause = buildClientWhere(input.search);

    const [rows, totalResult] = await Promise.all([
      db.query.client.findMany({
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          lastUpdatedBy: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        where: whereClause,
        orderBy: [desc(client.updatedAt)],
        limit: pageSize,
        offset,
      }),
      db
        .select({ total: sql<number>`count(*)` })
        .from(client)
        .where(whereClause),
    ]);

    const totalItems = Number(totalResult[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      success: true,
      data: {
        page,
        pageSize,
        totalItems,
        totalPages,
        rows: rows.map((item) => ({
          id: item.id,
          fullName: [item.names, item.first_last_name, item.second_last_name]
            .filter(Boolean)
            .join(' '),
          names: item.names,
          firstLastName: item.first_last_name,
          secondLastName: item.second_last_name ?? '',
          typeDocument: item.type_document,
          documentNumber: item.n_document,
          email: item.email ?? '',
          cellphone: item.cellphone,
          location: item.location ?? '',
          genre: item.genre ?? '',
          maritalStatus: item.marital_status ?? '',
          occupation: item.occupation ?? '',
          createdAt: item.createdAt?.toISOString() ?? null,
          updatedAt: item.updatedAt?.toISOString() ?? null,
          owner: item.owner
            ? {
                id: item.owner.id,
                name: item.owner.name,
                email: item.owner.email,
              }
            : null,
          lastUpdatedBy: item.lastUpdatedBy
            ? {
                id: item.lastUpdatedBy.id,
                name: item.lastUpdatedBy.name,
                email: item.lastUpdatedBy.email,
              }
            : null,
          canUpdate: canManageAnyClient || item.userId === currentUserId,
        })),
      },
    };
  } catch (error) {
    console.error('Error loading clients list:', error);
    return { success: false, error: 'No se pudo cargar la lista de clientes' };
  }
}

interface ClientInput {
  names: string;
  first_last_name: string;
  second_last_name?: string | null;
  type_document?: string | null;
  n_document?: number | string | null;
  email?: string | null;
  cellphone?: number | string | null;
  location?: string | null;
  genre?: string | null;
  marital_status?: string | null;
  occupation?: string | null;
}

export async function createClientAction(input: ClientInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para registrar un cliente',
      };
    }

    const names = String(input.names ?? '').trim();
    const firstLastName = String(input.first_last_name ?? '').trim();

    if (!names || !firstLastName) {
      return {
        success: false,
        error: 'Nombre y apellido paterno son obligatorios',
      };
    }

    const [createdClient] = await db
      .insert(client)
      .values({
        names,
        first_last_name: firstLastName,
        second_last_name: toOptionalText(input.second_last_name),
        type_document: toOptionalText(input.type_document) ?? 'CI',
        n_document: toOptionalInteger(input.n_document),
        email: toOptionalText(input.email),
        cellphone: toOptionalInteger(input.cellphone),
        location: toOptionalText(input.location),
        genre: toOptionalText(input.genre),
        marital_status: toOptionalText(input.marital_status),
        occupation: toOptionalText(input.occupation),
        userId: session.user.id,
        updatedByUserId: session.user.id,
      })
      .returning();

    revalidatePath('/clients');
    revalidatePath('/sales');
    return { success: true, data: createdClient };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: 'No se pudo registrar el cliente' };
  }
}

interface UpdateClientInput extends ClientInput {
  clientId: string;
}

export async function updateClientAction(input: UpdateClientInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para editar el cliente',
      };
    }

    if (!input.clientId) {
      return { success: false, error: 'Cliente inválido' };
    }

    const canManageAnyClient = isAdminRole(session.user.role);

    const currentClient = await db.query.client.findFirst({
      where: eq(client.id, input.clientId),
      columns: {
        id: true,
        userId: true,
      },
    });

    if (!currentClient) {
      return { success: false, error: 'No se encontró el cliente' };
    }

    if (
      !canManageAnyClient &&
      (!currentClient.userId || currentClient.userId !== session.user.id)
    ) {
      return {
        success: false,
        error: 'Solo el usuario creador o un admin puede editar este cliente',
      };
    }

    const names = String(input.names ?? '').trim();
    const firstLastName = String(input.first_last_name ?? '').trim();
    if (!names || !firstLastName) {
      return {
        success: false,
        error: 'Nombre y apellido paterno son obligatorios',
      };
    }

    await db
      .update(client)
      .set({
        names,
        first_last_name: firstLastName,
        second_last_name: toOptionalText(input.second_last_name),
        type_document: toOptionalText(input.type_document) ?? 'CI',
        n_document: toOptionalInteger(input.n_document),
        email: toOptionalText(input.email),
        cellphone: toOptionalInteger(input.cellphone),
        location: toOptionalText(input.location),
        genre: toOptionalText(input.genre),
        marital_status: toOptionalText(input.marital_status),
        occupation: toOptionalText(input.occupation),
        updatedByUserId: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(client.id, input.clientId));

    revalidatePath('/clients');
    revalidatePath('/sales');
    return { success: true };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: 'No se pudo editar el cliente' };
  }
}
