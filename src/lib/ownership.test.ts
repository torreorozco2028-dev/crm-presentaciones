import { describe, expect, it } from 'vitest';
import {
  canViewAllSales,
  isAdminRole,
  isViewerRole,
  resolveVisibleSalesUserId,
} from './ownership';

describe('viewer role helpers', () => {
  it('detects viewer ignoring case and nullish values', () => {
    expect(isViewerRole('viewer')).toBe(true);
    expect(isViewerRole('VIEWER')).toBe(true);
    expect(isViewerRole('user')).toBe(false);
    expect(isViewerRole('admin')).toBe(false);
    expect(isViewerRole(null)).toBe(false);
    expect(isViewerRole(undefined)).toBe(false);
  });

  it('viewer is not admin', () => {
    expect(isAdminRole('viewer')).toBe(false);
  });

  it('admin and viewer can view all sales, user cannot', () => {
    expect(canViewAllSales('admin')).toBe(true);
    expect(canViewAllSales('viewer')).toBe(true);
    expect(canViewAllSales('user')).toBe(false);
    expect(canViewAllSales(undefined)).toBe(false);
  });

  it('viewer sees every seller unless a filter is requested', () => {
    const viewer = canViewAllSales('viewer');
    expect(resolveVisibleSalesUserId(undefined, 'u1', viewer)).toBeUndefined();
    expect(resolveVisibleSalesUserId('all', 'u1', viewer)).toBeUndefined();
    expect(resolveVisibleSalesUserId('u2', 'u1', viewer)).toBe('u2');
  });

  it('regular user is always restricted to their own sales', () => {
    const user = canViewAllSales('user');
    expect(resolveVisibleSalesUserId(undefined, 'u1', user)).toBe('u1');
    expect(resolveVisibleSalesUserId('u2', 'u1', user)).toBe('u1');
  });
});
