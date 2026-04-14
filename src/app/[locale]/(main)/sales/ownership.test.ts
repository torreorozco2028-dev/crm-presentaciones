import { describe, expect, it } from 'vitest';
import {
  resolveVisibleSalesUserId,
  resolveClientVisibility,
} from '../../../../lib/ownership';

describe('sales ownership visibility', () => {
  it('forces regular users to their own sales filter', () => {
    expect(resolveVisibleSalesUserId('other-user', 'user-123', false)).toBe(
      'user-123'
    );
    expect(resolveVisibleSalesUserId('all', 'user-123', false)).toBe(
      'user-123'
    );
  });

  it('lets admins keep or clear the user filter', () => {
    expect(resolveVisibleSalesUserId('other-user', 'admin-1', true)).toBe(
      'other-user'
    );
    expect(resolveVisibleSalesUserId('all', 'admin-1', true)).toBeUndefined();
  });

  it('restricts visible clients for non-admin users', () => {
    expect(resolveClientVisibility('user-123', false)).toEqual({
      ownerUserId: 'user-123',
      canManageAnyClient: false,
    });
  });

  it('keeps global visibility for admins', () => {
    expect(resolveClientVisibility('admin-1', true)).toEqual({
      ownerUserId: undefined,
      canManageAnyClient: true,
    });
  });
});
