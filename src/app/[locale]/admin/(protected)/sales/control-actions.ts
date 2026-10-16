'use server';

import { auth } from '@/auth';
import { db } from '@/server/db/config';
import { building, sale_payments, sales } from '@/server/db/schema';
import { isAdminRole } from '@/lib/ownership';
import { computeControlRow, type Currency } from '@/lib/sales-control';
import { normalizeAdvanceType, normalizeCurrency } from '@/lib/sales-payment';
import { desc, eq } from 'drizzle-orm';
import { SALE_CONTROL_ENABLED } from '@/lib/feature-flags';

async function requireAdmin() {
  if (!SALE_CONTROL_ENABLED) {
    return { error: 'El control de ventas está deshabilitado' } as const;
  }
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Debes iniciar sesión' } as const;
  }
  if (!isAdminRole(session.user.role)) {
    return { error: 'Solo un admin puede usar el control de ventas' } as const;
  }
  return { userId: session.user.id } as const;
}

export async function getSalesControlBuildingsAction() {
  const guard = await requireAdmin();
  if ('error' in guard) return { success: false as const, error: guard.error };

  const rows = await db
    .select({ id: building.id, title: building.building_title })
    .from(building)
    .orderBy(building.building_title);
  return { success: true as const, data: rows };
}

export async function getSalesControlAction(buildingId: string) {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) {
      return { success: false as const, error: guard.error };
    }

    const [bld, units] = await Promise.all([
      db.query.building.findFirst({
        columns: { id: true, building_title: true, price_per_m2: true },
        where: eq(building.id, buildingId),
      }),
      db.query.unit_department.findMany({
        where: (u, { eq }) => eq(u.buildingId, buildingId),
        with: {
          model: {
            columns: { name_model_department: true, base_square_meters: true },
          },
          sales: {
            orderBy: [desc(sales.createdAt)],
            limit: 1,
            with: {
              client: {
                columns: {
                  names: true,
                  first_last_name: true,
                  second_last_name: true,
                },
              },
              payments: { orderBy: [desc(sale_payments.paid_at)] },
            },
          },
        },
      }),
    ]);

    if (!bld)
      return { success: false as const, error: 'Edificio no encontrado' };

    const rows = units
      .map((unit) => {
        const sale = unit.sales[0] ?? null;
        const real =
          unit.real_square_meters == null
            ? null
            : Number(unit.real_square_meters);
        const squareMeters =
          real != null && Number.isFinite(real)
            ? real
            : (unit.model?.base_square_meters ?? null);
        const saleCurrency: Currency =
          normalizeCurrency(sale?.currency) ?? 'BOB';
        const metrics = computeControlRow({
          squareMeters,
          buildingPricePerM2Usd: bld.price_per_m2,
          sale: sale
            ? {
                finalPrice: sale.final_price,
                currency: saleCurrency,
                exchangeRate: sale.exchangeRate,
                advanceExchangeRate: sale.advanceExchangeRate,
                advanceType: normalizeAdvanceType(sale.advanceType),
                advancePercentage: sale.advance_percentage,
                advanceAmount: sale.advanceAmount,
                payments: sale.payments.map((p) => ({
                  amount: p.amount,
                  currency: normalizeCurrency(p.currency),
                  exchangeRate: p.exchangeRate,
                })),
              }
            : null,
        });

        return {
          unitId: unit.id,
          unitNumber: unit.unit_number,
          floor: unit.floor,
          state: unit.state ?? 1,
          modelName: unit.model?.name_model_department ?? null,
          squareMeters,
          ...metrics,
          sale: sale
            ? {
                id: sale.id,
                clientName: [
                  sale.client.names,
                  sale.client.first_last_name,
                  sale.client.second_last_name,
                ]
                  .filter(Boolean)
                  .join(' '),
                currency: saleCurrency,
                exchangeRate: sale.exchangeRate,
                advanceExchangeRate: sale.advanceExchangeRate,
                sellerAgency: sale.seller_agency,
                hasCommission: sale.has_commission,
                hasInstallments: sale.has_installments,
                paymentFrequency: sale.payment_frequency,
                installmentsPercentage: sale.installments_percentage,
                globalPercentage: sale.global_percentage,
                salesExpensePercentage: sale.sales_expense_percentage,
                payments: sale.payments.map((p) => ({
                  id: p.id,
                  amount: p.amount,
                  currency: normalizeCurrency(p.currency),
                  exchangeRate: p.exchangeRate,
                  paidAt: p.paid_at.toISOString(),
                  note: p.note,
                })),
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          a.floor - b.floor ||
          String(a.unitNumber ?? '').localeCompare(
            String(b.unitNumber ?? ''),
            undefined,
            {
              numeric: true,
            }
          )
      );

    return {
      success: true as const,
      data: {
        buildingTitle: bld.building_title,
        pricePerM2: bld.price_per_m2,
        rows,
      },
    };
  } catch (error) {
    console.error('Error loading sales control:', error);
    return {
      success: false as const,
      error: 'No se pudo cargar el control de ventas',
    };
  }
}
