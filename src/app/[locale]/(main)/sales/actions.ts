'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import ClientEntity from '@/server/db/entities/clients';
import { db } from '@/server/db/config';
import { unit_department, sales, users } from '@/server/db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

const clientEntity = new ClientEntity();

type UnitState = 1 | 2 | 3;

function isAdminRole(role: unknown) {
  return String(role ?? '').toLowerCase() === 'admin';
}

function parseState(value: unknown): UnitState | null {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 2 || parsed === 3) {
    return parsed;
  }
  return null;
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

export async function registerClientAction(formData: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para registrar un cliente',
      };
    }

    const names = String(formData?.names ?? '').trim();
    const firstLastName = String(formData?.first_last_name ?? '').trim();

    if (!names || !firstLastName) {
      return {
        success: false,
        error: 'Nombre y apellido paterno son obligatorios',
      };
    }

    const newClient = await clientEntity.createClient({
      names,
      first_last_name: firstLastName,
      second_last_name: toOptionalText(formData?.second_last_name),
      // In schema this field is NOT NULL, so keep a safe default when omitted.
      type_document: toOptionalText(formData?.type_document) ?? 'CI',
      n_document: toOptionalInteger(formData?.n_document),
      email: toOptionalText(formData?.email),
      cellphone: toOptionalInteger(formData?.cellphone),
      location: toOptionalText(formData?.location),
      genre: toOptionalText(formData?.genre),
      marital_status: toOptionalText(formData?.marital_status),
      occupation: toOptionalText(formData?.occupation),
      userId: session.user.id,
      updatedByUserId: session.user.id,
    });

    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error registering client:', error);
    return { success: false, error: 'No se pudo registrar el cliente' };
  }
}

export async function getSalesSetupDataAction() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    const [clients, units, userOptions] = await Promise.all([
      db.query.client.findMany({
        columns: {
          id: true,
          names: true,
          first_last_name: true,
          second_last_name: true,
          email: true,
        },
        orderBy: (client, { desc }) => [desc(client.updatedAt)],
        limit: 200,
      }),
      db.query.unit_department.findMany({
        columns: {
          id: true,
          unit_number: true,
          floor: true,
          state: true,
        },
        with: {
          building: {
            columns: {
              building_title: true,
            },
          },
        },
        orderBy: [unit_department.floor, unit_department.unit_number],
      }),
      db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: [users.name],
        limit: 500,
      }),
    ]);

    return {
      success: true,
      data: {
        clients: clients.map((client) => ({
          id: client.id,
          fullName: [
            client.names,
            client.first_last_name,
            client.second_last_name,
          ]
            .filter(Boolean)
            .join(' '),
          email: client.email,
        })),
        units: units.map((unit) => ({
          id: unit.id,
          label: `${unit.building?.building_title ?? 'Edificio'} · Piso ${unit.floor} · Unidad ${unit.unit_number ?? '-'}`,
          state: parseState(unit.state) ?? 1,
        })),
        users: userOptions.map((item) => ({
          id: item.id,
          name: item.name ?? 'Sin nombre',
          email: item.email,
        })),
        currentUserId,
      },
    };
  } catch (error) {
    console.error('Error loading sales setup data:', error);
    return {
      success: false,
      error: 'No se pudo cargar la información de ventas',
    };
  }
}

interface CreateSaleInput {
  clientId: string;
  unitId: string;
  state: UnitState;
  finalPrice?: number | null;
  paymentMethod?: string;
  paymentNotes?: string;
}

export async function createSaleAction(input: CreateSaleInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para registrar una venta',
      };
    }

    const parsedState = parseState(input.state);
    if (!input.clientId || !input.unitId || !parsedState) {
      return {
        success: false,
        error: 'Datos incompletos para registrar la venta',
      };
    }

    await db.transaction(async (tx) => {
      await tx.insert(sales).values({
        clientId: input.clientId,
        unitId: input.unitId,
        userId: session.user.id,
        updatedByUserId: session.user.id,
        final_price: input.finalPrice ?? null,
        payment_method: input.paymentMethod || null,
        payment_notes: input.paymentNotes || null,
      });

      await tx
        .update(unit_department)
        .set({ state: parsedState, updatedAt: new Date() })
        .where(eq(unit_department.id, input.unitId));
    });

    revalidatePath('/sales');
    return { success: true };
  } catch (error) {
    console.error('Error creating sale:', error);
    return { success: false, error: 'No se pudo registrar la venta' };
  }
}

export async function updateUnitStateAction(unitId: string, state: UnitState) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para actualizar el estado',
      };
    }

    const canManageAnySale = isAdminRole(session.user.role);

    const parsedState = parseState(state);
    if (!unitId || !parsedState) {
      return { success: false, error: 'No se pudo actualizar el estado' };
    }

    const currentSale = await db.query.sales.findFirst({
      where: eq(sales.unitId, unitId),
      orderBy: [desc(sales.createdAt)],
      with: {
        seller: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!currentSale) {
      return {
        success: false,
        error: 'No existe una venta asociada a esta unidad',
      };
    }

    if (!canManageAnySale && currentSale.userId !== session.user.id) {
      return {
        success: false,
        error: 'Solo el propietario o un admin puede modificar esta reserva',
      };
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(unit_department)
        .set({ state: parsedState, updatedAt: now })
        .where(eq(unit_department.id, unitId));

      await tx
        .update(sales)
        .set({
          updatedByUserId: session.user.id,
          updatedAt: now,
        })
        .where(eq(sales.id, currentSale.id));
    });

    revalidatePath('/sales');
    return {
      success: true,
      updatedAt: now.toISOString(),
      updatedBy: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
    };
  } catch (error) {
    console.error('Error updating unit state:', error);
    return {
      success: false,
      error: 'No se pudo actualizar el estado de la unidad',
    };
  }
}

interface UpdateSaleInput {
  saleId: string;
  finalPrice?: number | null;
  paymentMethod?: string;
  paymentNotes?: string;
}

export async function updateSaleAction(input: UpdateSaleInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para editar la reserva',
      };
    }

    const canManageAnySale = isAdminRole(session.user.role);

    if (!input.saleId) {
      return { success: false, error: 'Reserva inválida' };
    }

    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, input.saleId),
      columns: {
        id: true,
        userId: true,
      },
    });

    if (!sale) {
      return { success: false, error: 'No se encontró la reserva' };
    }

    if (!canManageAnySale && sale.userId !== session.user.id) {
      return {
        success: false,
        error: 'Solo el propietario o un admin puede editar esta reserva',
      };
    }

    const now = new Date();
    await db
      .update(sales)
      .set({
        final_price: input.finalPrice ?? null,
        payment_method: input.paymentMethod?.trim() || null,
        payment_notes: input.paymentNotes?.trim() || null,
        updatedByUserId: session.user.id,
        updatedAt: now,
      })
      .where(eq(sales.id, input.saleId));

    revalidatePath('/sales');
    return { success: true, updatedAt: now.toISOString() };
  } catch (error) {
    console.error('Error updating sale:', error);
    return { success: false, error: 'No se pudo editar la reserva' };
  }
}

export async function deleteSaleAction(saleId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para eliminar la reserva',
      };
    }

    const canManageAnySale = isAdminRole(session.user.role);

    if (!saleId) {
      return { success: false, error: 'Reserva inválida' };
    }

    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, saleId),
      columns: {
        id: true,
        unitId: true,
        userId: true,
      },
    });

    if (!sale) {
      return { success: false, error: 'No se encontró la reserva' };
    }

    if (!canManageAnySale && sale.userId !== session.user.id) {
      return {
        success: false,
        error: 'Solo el propietario o un admin puede eliminar esta reserva',
      };
    }

    await db.transaction(async (tx) => {
      await tx.delete(sales).where(eq(sales.id, saleId));
      await tx
        .update(unit_department)
        .set({ state: 1, updatedAt: new Date() })
        .where(eq(unit_department.id, sale.unitId));
    });

    revalidatePath('/sales');
    return { success: true, unitId: sale.unitId };
  } catch (error) {
    console.error('Error deleting sale:', error);
    return { success: false, error: 'No se pudo eliminar la reserva' };
  }
}

interface GetSalesListInput {
  page?: number;
  pageSize?: number;
  detailQuery?: string;
  clientId?: string;
  unitId?: string;
  userId?: string;
}

function normalizePage(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function buildSalesWhere(input: GetSalesListInput) {
  const conditions = [];

  if (input.clientId && input.clientId !== 'all') {
    conditions.push(eq(sales.clientId, input.clientId));
  }

  if (input.unitId && input.unitId !== 'all') {
    conditions.push(eq(sales.unitId, input.unitId));
  }

  if (input.userId && input.userId !== 'all') {
    conditions.push(eq(sales.userId, input.userId));
  }

  const query = input.detailQuery?.trim();
  if (query) {
    const likeQuery = `%${query}%`;
    conditions.push(
      or(
        ilike(sales.payment_method, likeQuery),
        ilike(sales.payment_notes, likeQuery)
      )
    );
  }

  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

export async function getSalesListAction(input: GetSalesListInput = {}) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;
    const canManageAnySale = isAdminRole(session?.user?.role);

    const page = normalizePage(input.page, 1);
    const pageSize = Math.min(50, normalizePage(input.pageSize, 10));
    const offset = (page - 1) * pageSize;
    const whereClause = buildSalesWhere(input);

    const [rows, totalResult] = await Promise.all([
      db.query.sales.findMany({
        with: {
          client: {
            columns: {
              id: true,
              names: true,
              first_last_name: true,
              second_last_name: true,
            },
          },
          seller: {
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
          unit: {
            columns: {
              id: true,
              unit_number: true,
              floor: true,
              state: true,
            },
            with: {
              building: {
                columns: {
                  building_title: true,
                },
              },
            },
          },
        },
        where: whereClause,
        orderBy: [desc(sales.createdAt)],
        limit: pageSize,
        offset,
      }),
      db
        .select({ total: sql<number>`count(*)` })
        .from(sales)
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
        rows: rows.map((sale) => ({
          id: sale.id,
          userId: sale.userId,
          createdBy: {
            id: sale.seller.id,
            name: sale.seller.name,
            email: sale.seller.email,
          },
          unitId: sale.unit.id,
          clientId: sale.client.id,
          clientName: [
            sale.client.names,
            sale.client.first_last_name,
            sale.client.second_last_name,
          ]
            .filter(Boolean)
            .join(' '),
          unitLabel: `${sale.unit.building?.building_title ?? 'Edificio'} · Piso ${sale.unit.floor} · Unidad ${sale.unit.unit_number ?? '-'}`,
          state: parseState(sale.unit.state) ?? 1,
          detail: [sale.payment_method, sale.payment_notes]
            .filter(Boolean)
            .join(' - '),
          paymentMethod: sale.payment_method ?? '',
          paymentNotes: sale.payment_notes ?? '',
          finalPrice: sale.final_price,
          salesDate: sale.sales_date?.toISOString() ?? null,
          updatedAt: sale.updatedAt?.toISOString() ?? null,
          lastUpdatedBy: sale.lastUpdatedBy
            ? {
                id: sale.lastUpdatedBy.id,
                name: sale.lastUpdatedBy.name,
                email: sale.lastUpdatedBy.email,
              }
            : {
                id: sale.seller.id,
                name: sale.seller.name,
                email: sale.seller.email,
              },
          canUpdate: canManageAnySale || currentUserId === sale.userId,
        })),
      },
    };
  } catch (error) {
    console.error('Error loading filtered sales list:', error);
    return { success: false, error: 'No se pudo cargar la lista de ventas' };
  }
}
