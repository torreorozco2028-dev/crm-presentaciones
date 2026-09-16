export function normalizeAdvancePercentage(value: unknown) {
  const text = String(value ?? '')
    .replace('%', '')
    .trim();

  if (!text) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  return Math.round(parsed);
}

export function calculateAdvanceAmount(
  totalPrice: number | null | undefined,
  advancePercentage: number | null | undefined
) {
  if (
    totalPrice == null ||
    !Number.isFinite(totalPrice) ||
    advancePercentage == null ||
    !Number.isFinite(advancePercentage)
  ) {
    return null;
  }

  return Math.round((totalPrice * advancePercentage) / 100);
}

export function calculateRemainingAmount(
  totalPrice: number | null | undefined,
  advancePercentage: number | null | undefined
) {
  const advanceAmount = calculateAdvanceAmount(totalPrice, advancePercentage);

  if (
    totalPrice == null ||
    !Number.isFinite(totalPrice) ||
    advanceAmount == null
  ) {
    return null;
  }

  return Math.max(0, totalPrice - advanceAmount);
}

export type AdvanceType = 'percentage' | 'amount';
export type SaleCurrency = 'BOB' | 'USD';

export const SALE_CURRENCIES: SaleCurrency[] = ['BOB', 'USD'];

export function normalizeCurrency(value: unknown): SaleCurrency | null {
  const text = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!text) return null;
  return (SALE_CURRENCIES as string[]).includes(text)
    ? (text as SaleCurrency)
    : null;
}

export function normalizeAdvanceType(value: unknown): AdvanceType | null {
  return value === 'amount' || value === 'percentage' ? value : null;
}

interface AdvanceInput {
  totalPrice: number | null | undefined;
  advanceType: AdvanceType | null | undefined;
  advancePercentage: number | null | undefined;
  advanceAmount: number | null | undefined;
}

// A null/undefined advanceType is treated as 'percentage' for backwards compatibility
// with sales created before amount-based advances existed.
export function resolveAdvanceAmount(input: AdvanceInput) {
  if (input.advanceType === 'amount') {
    return input.advanceAmount != null && Number.isFinite(input.advanceAmount)
      ? input.advanceAmount
      : null;
  }

  return calculateAdvanceAmount(input.totalPrice, input.advancePercentage);
}

export function resolveRemainingAmount(input: AdvanceInput) {
  const advanceAmount = resolveAdvanceAmount(input);

  if (
    input.totalPrice == null ||
    !Number.isFinite(input.totalPrice) ||
    advanceAmount == null
  ) {
    return null;
  }

  return Math.max(0, input.totalPrice - advanceAmount);
}
