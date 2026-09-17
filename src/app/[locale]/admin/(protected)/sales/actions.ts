'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import ClientEntity from '@/server/db/entities/clients';
import { db } from '@/server/db/config';
import {
  client,
  unit_department,
  sales,
  sale_history,
  users,
} from '@/server/db/schema';
import {
  isAdminRole,
  resolveClientVisibility,
  resolveVisibleSalesUserId,
} from '@/lib/ownership';
import {
  normalizeAdvancePercentage,
  normalizeAdvanceType,
  normalizeCurrency,
  resolveAdvanceAmount,
  resolveRemainingAmount,
  type AdvanceType,
} from '@/lib/sales-payment';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

const clientEntity = new ClientEntity();

type UnitState = 1 | 2 | 3;

function parseState(value: unknown): UnitState | null {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 2 || parsed === 3) {
    return parsed;
  }
  return null;
}

function resolveSquareMeters(
  realSquareMeters: number | string | null | undefined,
  baseSquareMeters: number | null | undefined
) {
  const real = realSquareMeters == null ? null : Number(realSquareMeters);
  if (real != null && Number.isFinite(real)) return real;
  return baseSquareMeters ?? null;
}

interface AdvanceValidationInput {
  advanceType?: string;
  advancePercentage?: number | null;
  advanceAmount?: number | null;
  finalPrice?: number | null;
}

type AdvanceValidationResult =
  | {
      ok: true;
      advanceType: AdvanceType;
      advancePercentage: number | null;
      advanceAmount: number | null;
    }
  | { ok: false; error: string };

function validateAdvanceInput(
  input: AdvanceValidationInput
): AdvanceValidationResult {
  const advanceType: AdvanceType =
    normalizeAdvanceType(input.advanceType) ?? 'percentage';

  if (advanceType === 'amount') {
    if (input.advanceAmount == null) {
      return {
        ok: true,
        advanceType,
        advancePercentage: null,
        advanceAmount: null,
      };
    }

    const amount = Number(input.advanceAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, error: 'El adelanto debe ser un monto válido' };
    }

    if (input.finalPrice == null || input.finalPrice <= 0) {
      return {
        ok: false,
        error:
          'Debes ingresar el precio final para registrar un adelanto en monto',
      };
    }

    if (amount > input.finalPrice) {
      return {
        ok: false,
        error: 'El adelanto no puede ser mayor al precio final',
      };
    }

    return {
      ok: true,
      advanceType,
      advancePercentage: null,
      advanceAmount: Math.trunc(amount),
    };
  }

  const advancePercentage =
    input.advancePercentage == null
      ? null
      : normalizeAdvancePercentage(input.advancePercentage);

  if (input.advancePercentage != null && advancePercentage == null) {
    return { ok: false, error: 'El adelanto debe estar entre 0% y 100%' };
  }

  if (
    advancePercentage !== null &&
    (input.finalPrice == null || input.finalPrice <= 0)
  ) {
    return {
      ok: false,
      error: 'Debes ingresar el precio final para calcular el adelanto',
    };
  }

  return {
    ok: true,
    advanceType,
    advancePercentage,
    advanceAmount: null,
  };
}

const stateLabels: Record<UnitState, string> = {
  1: 'Disponible',
  2: 'Reservado',
  3: 'Vendido',
};

function formatClientFullName(input: {
  names: string;
  first_last_name: string;
  second_last_name: string | null;
}) {
  return [input.names, input.first_last_name, input.second_last_name]
    .filter(Boolean)
    .join(' ');
}

function formatMoney(amount: number | null, currency: string) {
  return amount != null ? `${amount.toLocaleString('es-BO')} ${currency}` : '-';
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

function parseRequiredDocumentNumber(value: unknown): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

function isUniqueDocumentViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
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

    const documentNumber = parseRequiredDocumentNumber(formData?.n_document);
    if (documentNumber === null) {
      return {
        success: false,
        error: 'El número de documento es obligatorio',
      };
    }

    const existingDocument = await db.query.client.findFirst({
      where: eq(client.n_document, documentNumber),
      columns: { id: true },
    });

    if (existingDocument) {
      return {
        success: false,
        error: 'Ya existe un cliente registrado con ese número de documento',
      };
    }

    const newClient = await clientEntity.createClient({
      names,
      first_last_name: firstLastName,
      second_last_name: toOptionalText(formData?.second_last_name),
      // In schema this field is NOT NULL, so keep a safe default when omitted.
      type_document: toOptionalText(formData?.type_document) ?? 'CI',
      n_document: documentNumber,
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
    if (isUniqueDocumentViolation(error)) {
      return {
        success: false,
        error: 'Ya existe un cliente registrado con ese número de documento',
      };
    }
    return { success: false, error: 'No se pudo registrar el cliente' };
  }
}

export async function getSalesSetupDataAction() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    if (!currentUserId) {
      return {
        success: false,
        error: 'Debes iniciar sesión para ver las ventas',
      };
    }

    const currentUserRole = String(session?.user?.role ?? '');
    const canManageAnySale = isAdminRole(currentUserRole);
    const { ownerUserId } = resolveClientVisibility(
      currentUserId,
      canManageAnySale
    );

    const [clients, units, userOptions] = await Promise.all([
      db.query.client.findMany({
        columns: {
          id: true,
          names: true,
          first_last_name: true,
          second_last_name: true,
          email: true,
        },
        where: ownerUserId ? eq(client.userId, ownerUserId) : undefined,
        orderBy: (client, { desc }) => [desc(client.updatedAt)],
        limit: 200,
      }),
      db.query.unit_department.findMany({
        columns: {
          id: true,
          unit_number: true,
          floor: true,
          state: true,
          real_square_meters: true,
        },
        with: {
          building: {
            columns: {
              building_title: true,
            },
          },
          model: {
            columns: {
              base_square_meters: true,
            },
          },
        },
        orderBy: [unit_department.floor, unit_department.unit_number],
      }),
      canManageAnySale
        ? db.query.users.findMany({
            columns: {
              id: true,
              name: true,
              email: true,
            },
            orderBy: [users.name],
            limit: 500,
          })
        : Promise.resolve([
            {
              id: currentUserId,
              name: session?.user?.name ?? 'Mis ventas',
              email: session?.user?.email ?? null,
            },
          ]),
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
          squareMeters: resolveSquareMeters(
            unit.real_square_meters,
            unit.model?.base_square_meters
          ),
        })),
        users: userOptions.map((item) => ({
          id: item.id,
          name: item.name ?? 'Sin nombre',
          email: item.email,
        })),
        currentUserId,
        currentUserRole,
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
  currency?: string;
  exchangeRate?: number | null;
  advanceType?: string;
  advancePercentage?: number | null;
  advanceAmount?: number | null;
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

    const canManageAnySale = isAdminRole(session.user.role);
    const selectedClient = await db.query.client.findFirst({
      where: eq(client.id, input.clientId),
      columns: {
        id: true,
        userId: true,
      },
    });

    if (!selectedClient) {
      return {
        success: false,
        error: 'No se encontró el cliente seleccionado',
      };
    }

    if (!canManageAnySale && selectedClient.userId !== session.user.id) {
      return {
        success: false,
        error: 'Solo puedes registrar ventas para tus clientes',
      };
    }

    const advanceResult = validateAdvanceInput({
      advanceType: input.advanceType,
      advancePercentage: input.advancePercentage,
      advanceAmount: input.advanceAmount,
      finalPrice: input.finalPrice,
    });

    if (!advanceResult.ok) {
      return { success: false, error: advanceResult.error };
    }

    const currency = normalizeCurrency(input.currency) ?? 'BOB';
    const exchangeRate =
      input.exchangeRate == null || !Number.isFinite(Number(input.exchangeRate))
        ? null
        : Number(input.exchangeRate);

    await db.transaction(async (tx) => {
      const [insertedSale] = await tx
        .insert(sales)
        .values({
          clientId: input.clientId,
          unitId: input.unitId,
          userId: session.user.id,
          updatedByUserId: session.user.id,
          final_price: input.finalPrice ?? null,
          currency,
          exchangeRate,
          advanceType: advanceResult.advanceType,
          advance_percentage: advanceResult.advancePercentage,
          advanceAmount: advanceResult.advanceAmount,
          payment_method: input.paymentMethod || null,
          payment_notes: input.paymentNotes || null,
        })
        .returning({ id: sales.id });

      await tx
        .update(unit_department)
        .set({ state: parsedState, updatedAt: new Date() })
        .where(eq(unit_department.id, input.unitId));

      await tx.insert(sale_history).values({
        saleId: insertedSale.id,
        userId: session.user.id,
        type: 'system',
        summary: 'Venta registrada',
      });
    });

    revalidatePath('/admin/sales');
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

    const currentUnit = await db.query.unit_department.findFirst({
      where: eq(unit_department.id, unitId),
      columns: { state: true },
    });
    const previousState = parseState(currentUnit?.state);

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

      if (previousState !== parsedState) {
        await tx.insert(sale_history).values({
          saleId: currentSale.id,
          userId: session.user.id,
          type: 'system',
          summary: `Estado actualizado: ${stateLabels[previousState ?? 1]} → ${stateLabels[parsedState]}`,
        });
      }
    });

    revalidatePath('/admin/sales');
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
  clientId?: string;
  unitId?: string;
  finalPrice?: number | null;
  currency?: string;
  exchangeRate?: number | null;
  advanceType?: string;
  advancePercentage?: number | null;
  advanceAmount?: number | null;
  paymentMethod?: string;
  paymentNotes?: string;
}

async function loadUnitLabel(unitId: string) {
  const unit = await db.query.unit_department.findFirst({
    where: eq(unit_department.id, unitId),
    columns: { id: true, unit_number: true, floor: true, state: true },
    with: { building: { columns: { building_title: true } } },
  });

  if (!unit) return null;

  return {
    id: unit.id,
    state: parseState(unit.state) ?? 1,
    label: `${unit.building?.building_title ?? 'Edificio'} · Piso ${unit.floor} · Unidad ${unit.unit_number ?? '-'}`,
  };
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
        unitId: true,
        clientId: true,
        final_price: true,
        currency: true,
        advanceType: true,
        advance_percentage: true,
        advanceAmount: true,
        payment_method: true,
        payment_notes: true,
      },
      with: {
        client: {
          columns: {
            id: true,
            names: true,
            first_last_name: true,
            second_last_name: true,
          },
        },
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

    const advanceResult = validateAdvanceInput({
      advanceType: input.advanceType,
      advancePercentage: input.advancePercentage,
      advanceAmount: input.advanceAmount,
      finalPrice: input.finalPrice,
    });

    if (!advanceResult.ok) {
      return { success: false, error: advanceResult.error };
    }

    const requestedUnitId = input.unitId?.trim() || sale.unitId;
    let reassignment: {
      oldUnit: NonNullable<Awaited<ReturnType<typeof loadUnitLabel>>>;
      newUnit: NonNullable<Awaited<ReturnType<typeof loadUnitLabel>>>;
    } | null = null;

    if (requestedUnitId !== sale.unitId) {
      const [oldUnit, newUnit] = await Promise.all([
        loadUnitLabel(sale.unitId),
        loadUnitLabel(requestedUnitId),
      ]);

      if (!oldUnit || !newUnit) {
        return { success: false, error: 'No se encontró la unidad' };
      }

      if (newUnit.state !== 1) {
        return {
          success: false,
          error: 'La unidad seleccionada no está disponible',
        };
      }

      reassignment = { oldUnit, newUnit };
    }

    const requestedClientId = input.clientId?.trim() || sale.clientId;
    let clientChange: { oldName: string; newName: string } | null = null;

    if (requestedClientId !== sale.clientId) {
      const newClient = await db.query.client.findFirst({
        where: eq(client.id, requestedClientId),
        columns: {
          id: true,
          names: true,
          first_last_name: true,
          second_last_name: true,
          userId: true,
        },
      });

      if (!newClient) {
        return {
          success: false,
          error: 'No se encontró el cliente seleccionado',
        };
      }

      if (!canManageAnySale && newClient.userId !== session.user.id) {
        return {
          success: false,
          error: 'Solo puedes asignar tus propios clientes a la reserva',
        };
      }

      clientChange = {
        oldName: formatClientFullName(sale.client),
        newName: formatClientFullName(newClient),
      };
    }

    const nextFinalPrice = input.finalPrice ?? null;
    const nextCurrency = normalizeCurrency(input.currency) ?? 'BOB';
    const nextExchangeRate =
      input.exchangeRate == null || !Number.isFinite(Number(input.exchangeRate))
        ? null
        : Number(input.exchangeRate);
    const nextPaymentMethod = input.paymentMethod?.trim() || null;
    const nextPaymentNotes = input.paymentNotes?.trim() || null;

    const changes: string[] = [];
    if (clientChange) {
      changes.push(
        `Cliente: ${clientChange.oldName} → ${clientChange.newName}`
      );
    }
    if (reassignment) {
      changes.push(
        `Unidad: ${reassignment.oldUnit.label} → ${reassignment.newUnit.label}`
      );
    }
    if (
      sale.final_price !== nextFinalPrice ||
      (sale.currency ?? 'BOB') !== nextCurrency
    ) {
      changes.push(
        `Precio: ${formatMoney(sale.final_price, sale.currency ?? 'BOB')} → ${formatMoney(nextFinalPrice, nextCurrency)}`
      );
    }
    const prevAdvanceAmount = resolveAdvanceAmount({
      totalPrice: sale.final_price,
      advanceType: sale.advanceType as AdvanceType | null,
      advancePercentage: sale.advance_percentage,
      advanceAmount: sale.advanceAmount,
    });
    const nextAdvanceAmount = resolveAdvanceAmount({
      totalPrice: nextFinalPrice,
      advanceType: advanceResult.advanceType,
      advancePercentage: advanceResult.advancePercentage,
      advanceAmount: advanceResult.advanceAmount,
    });
    if (
      prevAdvanceAmount !== nextAdvanceAmount ||
      sale.advanceType !== advanceResult.advanceType
    ) {
      changes.push(
        `Adelanto: ${formatMoney(prevAdvanceAmount, sale.currency ?? 'BOB')} → ${formatMoney(nextAdvanceAmount, nextCurrency)}`
      );
    }
    if ((sale.payment_method ?? '') !== (nextPaymentMethod ?? '')) {
      changes.push(
        `Método de pago: ${sale.payment_method || '-'} → ${nextPaymentMethod || '-'}`
      );
    }
    if ((sale.payment_notes ?? '') !== (nextPaymentNotes ?? '')) {
      changes.push('Notas de pago actualizadas');
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(sales)
        .set({
          clientId: requestedClientId,
          unitId: requestedUnitId,
          final_price: nextFinalPrice,
          currency: nextCurrency,
          exchangeRate: nextExchangeRate,
          advanceType: advanceResult.advanceType,
          advance_percentage: advanceResult.advancePercentage,
          advanceAmount: advanceResult.advanceAmount,
          payment_method: nextPaymentMethod,
          payment_notes: nextPaymentNotes,
          updatedByUserId: session.user.id,
          updatedAt: now,
        })
        .where(eq(sales.id, input.saleId));

      if (reassignment) {
        await tx
          .update(unit_department)
          .set({ state: 1, updatedAt: now })
          .where(eq(unit_department.id, reassignment.oldUnit.id));

        await tx
          .update(unit_department)
          .set({ state: reassignment.oldUnit.state, updatedAt: now })
          .where(eq(unit_department.id, reassignment.newUnit.id));
      }

      if (changes.length > 0) {
        await tx.insert(sale_history).values({
          saleId: input.saleId,
          userId: session.user.id,
          type: 'system',
          summary: changes.join('\n'),
        });
      }
    });

    revalidatePath('/admin/sales');
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

    revalidatePath('/admin/sales');
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

function buildSalesWhere(
  input: GetSalesListInput,
  currentUserId: string | null,
  canManageAnySale: boolean
) {
  const conditions = [];

  if (input.clientId && input.clientId !== 'all') {
    conditions.push(eq(sales.clientId, input.clientId));
  }

  if (input.unitId && input.unitId !== 'all') {
    conditions.push(eq(sales.unitId, input.unitId));
  }

  const visibleUserId = resolveVisibleSalesUserId(
    input.userId,
    currentUserId,
    canManageAnySale
  );

  if (visibleUserId) {
    conditions.push(eq(sales.userId, visibleUserId));
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

    if (!currentUserId) {
      return {
        success: false,
        error: 'Debes iniciar sesión para ver las ventas',
      };
    }

    const page = normalizePage(input.page, 1);
    const pageSize = Math.min(50, normalizePage(input.pageSize, 10));
    const offset = (page - 1) * pageSize;
    const whereClause = buildSalesWhere(input, currentUserId, canManageAnySale);

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
              real_square_meters: true,
            },
            with: {
              building: {
                columns: {
                  building_title: true,
                },
              },
              model: {
                columns: {
                  base_square_meters: true,
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
          unitSquareMeters: resolveSquareMeters(
            sale.unit.real_square_meters,
            sale.unit.model?.base_square_meters
          ),
          state: parseState(sale.unit.state) ?? 1,
          detail: [sale.payment_method, sale.payment_notes]
            .filter(Boolean)
            .join(' - '),
          paymentMethod: sale.payment_method ?? '',
          paymentNotes: sale.payment_notes ?? '',
          finalPrice: sale.final_price,
          currency: sale.currency ?? 'BOB',
          exchangeRate: sale.exchangeRate,
          advanceType: (sale.advanceType === 'amount'
            ? 'amount'
            : 'percentage') as AdvanceType,
          advancePercentage: sale.advance_percentage ?? null,
          advanceFixedAmount: sale.advanceAmount ?? null,
          advanceAmount: resolveAdvanceAmount({
            totalPrice: sale.final_price,
            advanceType: sale.advanceType as AdvanceType | null,
            advancePercentage: sale.advance_percentage,
            advanceAmount: sale.advanceAmount,
          }),
          remainingAmount: resolveRemainingAmount({
            totalPrice: sale.final_price,
            advanceType: sale.advanceType as AdvanceType | null,
            advancePercentage: sale.advance_percentage,
            advanceAmount: sale.advanceAmount,
          }),
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

async function loadSaleForHistoryAccess(saleId: string) {
  return db.query.sales.findFirst({
    where: eq(sales.id, saleId),
    columns: { id: true, userId: true },
  });
}

interface GetSaleHistoryInput {
  saleId: string;
  page?: number;
  pageSize?: number;
}

export async function getSaleHistoryAction(input: GetSaleHistoryInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para ver el historial',
      };
    }

    if (!input.saleId) {
      return { success: false, error: 'Reserva inválida' };
    }

    const canManageAnySale = isAdminRole(session.user.role);
    const sale = await loadSaleForHistoryAccess(input.saleId);

    if (!sale) {
      return { success: false, error: 'No se encontró la reserva' };
    }

    if (!canManageAnySale && sale.userId !== session.user.id) {
      return {
        success: false,
        error: 'Solo el propietario o un admin puede ver este historial',
      };
    }

    const page = normalizePage(input.page, 1);
    const pageSize = Math.min(50, normalizePage(input.pageSize, 10));
    const offset = (page - 1) * pageSize;

    const [rows, totalResult] = await Promise.all([
      db.query.sale_history.findMany({
        where: eq(sale_history.saleId, input.saleId),
        with: {
          user: {
            columns: { id: true, name: true, email: true },
          },
        },
        orderBy: [desc(sale_history.createdAt)],
        limit: pageSize,
        offset,
      }),
      db
        .select({ total: sql<number>`count(*)` })
        .from(sale_history)
        .where(eq(sale_history.saleId, input.saleId)),
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
        rows: rows.map((row) => ({
          id: row.id,
          type:
            row.type === 'comment' ? ('comment' as const) : ('system' as const),
          summary: row.summary,
          createdAt: row.createdAt?.toISOString() ?? null,
          user: {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          },
        })),
      },
    };
  } catch (error) {
    console.error('Error loading sale history:', error);
    return { success: false, error: 'No se pudo cargar el historial' };
  }
}

interface AddSaleCommentInput {
  saleId: string;
  comment: string;
}

export async function addSaleCommentAction(input: AddSaleCommentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para agregar un comentario',
      };
    }

    const comment = toOptionalText(input.comment);
    if (!input.saleId || !comment) {
      return {
        success: false,
        error: 'Escribe un comentario antes de guardarlo',
      };
    }

    const canManageAnySale = isAdminRole(session.user.role);
    const sale = await loadSaleForHistoryAccess(input.saleId);

    if (!sale) {
      return { success: false, error: 'No se encontró la reserva' };
    }

    if (!canManageAnySale && sale.userId !== session.user.id) {
      return {
        success: false,
        error: 'Solo el propietario o un admin puede comentar esta reserva',
      };
    }

    await db.insert(sale_history).values({
      saleId: input.saleId,
      userId: session.user.id,
      type: 'comment',
      summary: comment,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding sale comment:', error);
    return { success: false, error: 'No se pudo guardar el comentario' };
  }
}
