import { describe, expect, it } from 'vitest';
import {
  calculateAdvanceAmount,
  normalizeAdvancePercentage,
} from './sales-payment';

describe('sales payment helpers', () => {
  it('normalizes valid advance percentages', () => {
    expect(normalizeAdvancePercentage('13')).toBe(13);
    expect(normalizeAdvancePercentage(30)).toBe(30);
  });

  it('rejects invalid percentage values', () => {
    expect(normalizeAdvancePercentage('')).toBeNull();
    expect(normalizeAdvancePercentage(-5)).toBeNull();
    expect(normalizeAdvancePercentage(120)).toBeNull();
  });

  it('calculates the advance amount over the total price', () => {
    expect(calculateAdvanceAmount(100000, 13)).toBe(13000);
    expect(calculateAdvanceAmount(250000, 30)).toBe(75000);
  });
});
