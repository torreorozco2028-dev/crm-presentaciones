import { db } from '@/server/db/config';
import { sale_history, sale_payments, sales } from '@/server/db/schema';
import { normalizeCurrency } from '@/lib/sales-payment';
import { eq } from 'drizzle-orm';

// Lógica compartida de control de ventas y pagos. No valida permisos: quien la
// llama (acciones del vendedor o del admin) decide quién puede editar la venta.

function toText(value: unknown, max: number) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
}

function toRate(value: unknown) {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 1000 ? n : undefined;
}

function toPercent(value: unknown) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined;
}

type ServiceResult = { success: true } | { success: false; error: string };

export interface SaleControlInput {
  saleId: string;
  sellerAgency?: string;
  hasCommission?: boolean;
  hasInstallments?: boolean;
  paymentFrequency?: string;
  installmentsPercentage?: number | string | null;
  globalPercentage?: number | string | null;
  salesExpensePercentage?: number | string | null;
  exchangeRate?: number | string | null;
  advanceExchangeRate?: number | string | null;
}

export async function saveSaleControl(
  userId: string,
  input: SaleControlInput
): Promise<ServiceResult> {
  const installments = toPercent(input.installmentsPercentage);
  const global = toPercent(input.globalPercentage);
  const expense = toPercent(input.salesExpensePercentage);
  const exchangeRate = toRate(input.exchangeRate);
  const advanceExchangeRate = toRate(input.advanceExchangeRate);
  if (exchangeRate === undefined || advanceExchangeRate === undefined) {
    return { success: false, error: 'El tipo de cambio debe ser mayor a 0' };
  }
  if (
    installments === undefined ||
    global === undefined ||
    expense === undefined
  ) {
    return {
      success: false,
      error: 'Los porcentajes deben estar entre 0 y 100',
    };
  }

  const previous = await db.query.sales.findFirst({
    where: eq(sales.id, input.saleId),
  });
  if (!previous) return { success: false, error: 'Venta no encontrada' };

  const next = {
    seller_agency: toText(input.sellerAgency, 100),
    has_commission: Boolean(input.hasCommission),
    has_installments: Boolean(input.hasInstallments),
    payment_frequency: toText(input.paymentFrequency, 50),
    installments_percentage:
      installments == null ? null : Math.round(installments),
    global_percentage: global,
    sales_expense_percentage: expense,
    exchangeRate,
    advanceExchangeRate,
  };

  const labels: Array<[keyof typeof next, string]> = [
    ['seller_agency', 'Vendedor / agencia'],
    ['has_commission', 'Comisión'],
    ['has_installments', 'Cuotas'],
    ['payment_frequency', 'Frecuencia de pago'],
    ['installments_percentage', '% de cuotas'],
    ['global_percentage', 'Monto global (%)'],
    ['sales_expense_percentage', 'Gastos de venta (%)'],
    ['exchangeRate', 'TC del total'],
    ['advanceExchangeRate', 'TC del anticipo'],
  ];
  const show = (v: unknown) =>
    v == null || v === ''
      ? '-'
      : typeof v === 'boolean'
        ? v
          ? 'Sí'
          : 'No'
        : String(v);
  const changes = labels
    .filter(([key]) => (previous[key] ?? null) !== (next[key] ?? null))
    .map(
      ([key, label]) => `${label}: ${show(previous[key])} → ${show(next[key])}`
    );

  await db.transaction(async (tx) => {
    await tx
      .update(sales)
      .set({ ...next, updatedByUserId: userId, updatedAt: new Date() })
      .where(eq(sales.id, input.saleId));
    if (changes.length > 0) {
      await tx.insert(sale_history).values({
        saleId: input.saleId,
        userId,
        type: 'system',
        summary: changes.join('\n'),
      });
    }
  });

  return { success: true };
}

export interface SalePaymentInput {
  saleId: string;
  amount: number | string;
  currency?: string;
  exchangeRate?: number | string | null;
  paidAt?: string;
  note?: string;
}

export async function registerSalePayment(
  userId: string,
  input: SalePaymentInput
): Promise<ServiceResult> {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a 0' };
  }
  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    return { success: false, error: 'La fecha del pago no es válida' };
  }
  const rate = toRate(input.exchangeRate);
  if (rate === undefined) {
    return { success: false, error: 'El tipo de cambio debe ser mayor a 0' };
  }

  const sale = await db.query.sales.findFirst({
    columns: { id: true, currency: true },
    where: eq(sales.id, input.saleId),
  });
  if (!sale) return { success: false, error: 'Venta no encontrada' };

  const currency = normalizeCurrency(input.currency) ?? sale.currency ?? 'BOB';
  const rounded = Math.round(amount * 100) / 100;
  const note = toText(input.note, 500);

  await db.transaction(async (tx) => {
    await tx.insert(sale_payments).values({
      saleId: sale.id,
      amount: rounded,
      currency,
      exchangeRate: rate,
      paid_at: paidAt,
      note,
      userId,
    });
    await tx.insert(sale_history).values({
      saleId: sale.id,
      userId,
      type: 'system',
      summary: `Pago registrado: ${rounded.toFixed(2)} ${currency}${rate ? ` (TC ${rate})` : ''}${note ? ` · ${note}` : ''}`,
    });
  });

  return { success: true };
}

export async function loadSalePayment(paymentId: string) {
  return db.query.sale_payments.findFirst({
    columns: { id: true, saleId: true },
    where: eq(sale_payments.id, paymentId),
  });
}

export async function removeSalePayment(
  userId: string,
  paymentId: string
): Promise<ServiceResult> {
  const payment = await db.query.sale_payments.findFirst({
    where: eq(sale_payments.id, paymentId),
  });
  if (!payment) return { success: false, error: 'Pago no encontrado' };

  const currency = payment.currency ?? 'BOB';
  await db.transaction(async (tx) => {
    await tx.delete(sale_payments).where(eq(sale_payments.id, paymentId));
    await tx.insert(sale_history).values({
      saleId: payment.saleId,
      userId,
      type: 'system',
      summary: `Pago eliminado: ${payment.amount.toFixed(2)} ${currency}${payment.exchangeRate ? ` (TC ${payment.exchangeRate})` : ''} del ${payment.paid_at.toLocaleDateString('es-BO')}${payment.note ? ` · ${payment.note}` : ''}`,
    });
  });

  return { success: true };
}
