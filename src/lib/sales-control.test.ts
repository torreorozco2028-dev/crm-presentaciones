import { describe, expect, it } from 'vitest';
import { computeControlRow, toMoney } from './sales-control';

const baseSale = {
  finalPrice: 10000,
  currency: 'USD' as const,
  exchangeRate: 7,
  advanceExchangeRate: 7,
  advanceType: 'percentage' as const,
  advancePercentage: 10,
  advanceAmount: null,
  payments: [],
};
const row = (sale: typeof baseSale | null, extra = {}) =>
  computeControlRow({
    squareMeters: 50,
    buildingPricePerM2Usd: null,
    sale: sale && { ...sale, ...extra },
  });

describe('toMoney', () => {
  it('convierte con el TC dado', () => {
    expect(toMoney(696, 'BOB', 6.96)).toEqual({ bob: 696, usd: 100 });
    expect(toMoney(100, 'USD', 6.96)).toEqual({ bob: 696, usd: 100 });
  });
  it('sin TC solo muestra la moneda original', () => {
    expect(toMoney(100, 'USD', null)).toEqual({ bob: null, usd: 100 });
    expect(toMoney(700, 'BOB', 0)).toEqual({ bob: 700, usd: null });
  });
});

describe('computeControlRow', () => {
  it('una unidad sin venta se estima solo en USD (no hay TC)', () => {
    const r = computeControlRow({
      squareMeters: 40,
      buildingPricePerM2Usd: 1100,
      sale: null,
    });
    expect(r.totalCost).toEqual({ bob: null, usd: 44000 });
    expect(r.balance).toBeNull();
  });

  it('total en ambas monedas con el TC de la venta', () => {
    const r = row(baseSale);
    expect(r.totalCost).toEqual({ bob: 70000, usd: 10000 });
    expect(r.pricePerM2).toEqual({ bob: 1400, usd: 200 });
    expect(r.missingRate).toBe(false);
  });

  it('el anticipo usa su propio TC, sin heredar el del total', () => {
    expect(row(baseSale, { advanceExchangeRate: 6.9 }).initialAmount).toEqual({
      bob: 6900,
      usd: 1000,
    });
    const r = row(baseSale, { advanceExchangeRate: null });
    expect(r.initialAmount).toEqual({ bob: null, usd: 1000 });
    expect(r.missingRate).toBe(true);
  });

  it('cada pago usa su TC y moneda; el saldo va en moneda de la venta', () => {
    const r = row(baseSale, {
      payments: [
        { amount: 2000, currency: 'USD', exchangeRate: 6.9 },
        { amount: 3500, currency: 'BOB', exchangeRate: 7 },
      ],
    });
    expect(r.paid).toEqual({ bob: 17300, usd: 2500 });
    expect(r.paidPercentage).toBe(25);
    expect(r.balance).toEqual({ bob: 52500, usd: 7500 });
  });

  it('un pago en otra moneda sin TC no cuenta para el saldo y se avisa', () => {
    const r = row(baseSale, {
      payments: [{ amount: 3500, currency: 'BOB', exchangeRate: null }],
    });
    expect(r.paid).toEqual({ bob: 3500, usd: null });
    expect(r.balance).toEqual({ bob: 70000, usd: 10000 });
    expect(r.missingRate).toBe(true);
  });

  it('el saldo nunca es negativo', () => {
    const r = row(baseSale, {
      payments: [{ amount: 20000, currency: null, exchangeRate: 7 }],
    });
    expect(r.balance).toEqual({ bob: 0, usd: 0 });
  });
});
