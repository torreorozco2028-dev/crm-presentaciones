import { resolveAdvanceAmount, type AdvanceType } from './sales-payment';

const round2 = (value: number) => Math.round(value * 100) / 100;

export type Currency = 'BOB' | 'USD';

/**
 * Un monto en bolivianos y en dolares. La moneda en la que se pacto siempre
 * esta; la otra solo existe si el concepto tiene tipo de cambio propio.
 */
export interface Money {
  bob: number | null;
  usd: number | null;
}

/** rate = bolivianos por dolar; null/0 = sin tipo de cambio. */
export function toMoney(
  amount: number,
  currency: Currency,
  rate: number | null
): Money {
  const valid = rate != null && rate > 0 ? rate : null;
  if (currency === 'BOB') {
    return {
      bob: round2(amount),
      usd: valid ? round2(amount / valid) : null,
    };
  }
  return { bob: valid ? round2(amount * valid) : null, usd: round2(amount) };
}

const sumField = (items: Money[], field: keyof Money) => {
  const values = items.map((m) => m[field]);
  return values.length > 0 && values.every((v) => v != null)
    ? round2(values.reduce<number>((acc, v) => acc + (v ?? 0), 0))
    : values.length === 0
      ? 0
      : null;
};

export interface ControlPaymentInput {
  amount: number;
  currency: Currency | null;
  exchangeRate: number | null;
}

export interface ControlSaleInput {
  finalPrice: number | null;
  currency: Currency;
  /** TC del precio total. */
  exchangeRate: number | null;
  /** TC propio del anticipo. */
  advanceExchangeRate: number | null;
  advanceType: AdvanceType | null;
  advancePercentage: number | null;
  advanceAmount: number | null;
  payments: ControlPaymentInput[];
}

export interface ControlRowInput {
  squareMeters: number | null;
  /** Precio por m2 del edificio, en USD. */
  buildingPricePerM2Usd: number | null;
  sale: ControlSaleInput | null;
}

export interface ControlRowMetrics {
  totalCost: Money | null;
  pricePerM2: Money | null;
  initialAmount: Money | null;
  initialPercentage: number | null;
  paid: Money | null;
  paidPercentage: number | null;
  balance: Money | null;
  /** true si algun concepto de la venta no tiene tipo de cambio para convertirse. */
  missingRate: boolean;
}

export function computeControlRow(input: ControlRowInput): ControlRowMetrics {
  const { squareMeters, buildingPricePerM2Usd, sale } = input;

  if (!sale || sale.finalPrice == null) {
    const usd =
      squareMeters != null && buildingPricePerM2Usd != null
        ? round2(squareMeters * buildingPricePerM2Usd)
        : null;
    return {
      totalCost: usd != null ? { bob: null, usd } : null,
      pricePerM2:
        buildingPricePerM2Usd != null
          ? { bob: null, usd: buildingPricePerM2Usd }
          : null,
      initialAmount: null,
      initialPercentage: null,
      paid: null,
      paidPercentage: null,
      balance: null,
      missingRate: false,
    };
  }

  const total = toMoney(sale.finalPrice, sale.currency, sale.exchangeRate);
  const perM2 = (field: keyof Money) =>
    squareMeters && total[field] != null
      ? round2((total[field] as number) / squareMeters)
      : null;

  const initialInSale = resolveAdvanceAmount({
    totalPrice: sale.finalPrice,
    advanceType: sale.advanceType,
    advancePercentage: sale.advancePercentage,
    advanceAmount: sale.advanceAmount,
  });
  const initialAmount =
    initialInSale != null
      ? toMoney(initialInSale, sale.currency, sale.advanceExchangeRate)
      : null;
  const initialPercentage =
    initialInSale != null && sale.finalPrice
      ? round2((initialInSale / sale.finalPrice) * 100)
      : null;

  const payments = sale.payments.map((p) => ({
    currency: p.currency ?? sale.currency,
    money: toMoney(p.amount, p.currency ?? sale.currency, p.exchangeRate),
    amount: p.amount,
    rate: p.exchangeRate,
  }));
  const paid: Money = {
    bob: sumField(
      payments.map((p) => p.money),
      'bob'
    ),
    usd: sumField(
      payments.map((p) => p.money),
      'usd'
    ),
  };
  // Pagos en la otra moneda solo cuentan para el saldo si tienen TC propio.
  const paidInSale = round2(
    payments.reduce((acc, p) => {
      const converted = sale.currency === 'BOB' ? p.money.bob : p.money.usd;
      return acc + (converted ?? 0);
    }, 0)
  );
  const paidPercentage = sale.finalPrice
    ? round2((paidInSale / sale.finalPrice) * 100)
    : null;
  const balance = toMoney(
    Math.max(0, round2(sale.finalPrice - paidInSale)),
    sale.currency,
    sale.exchangeRate
  );

  const missingRate =
    total.bob == null ||
    total.usd == null ||
    (initialAmount != null &&
      (initialAmount.bob == null || initialAmount.usd == null)) ||
    paid.bob == null ||
    paid.usd == null;

  return {
    totalCost: total,
    pricePerM2:
      squareMeters != null ? { bob: perM2('bob'), usd: perM2('usd') } : null,
    initialAmount,
    initialPercentage,
    paid,
    paidPercentage,
    balance,
    missingRate,
  };
}
