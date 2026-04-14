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
