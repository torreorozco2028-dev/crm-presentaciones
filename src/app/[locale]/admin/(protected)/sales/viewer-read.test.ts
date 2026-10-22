import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, findMany } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/auth', () => ({ auth: () => authMock() }));
vi.mock('@/server/services/sale-control', () => ({
  loadSalePayment: vi.fn(),
  registerSalePayment: vi.fn(),
  removeSalePayment: vi.fn(),
  saveSaleControl: vi.fn(),
}));
vi.mock('@/server/db/entities/clients', () => ({ default: class {} }));
vi.mock('@/server/db/config', () => ({
  db: {
    query: { sales: { findMany } },
    select: () => ({
      from: () => ({ where: () => Promise.resolve([{ total: 1 }]) }),
    }),
  },
}));

import { getSalesListAction } from './actions';

// Venta creada por otro usuario ('seller-1').
const sale = {
  id: 's1',
  userId: 'seller-1',
  seller: { id: 'seller-1', name: 'Vendedor', email: 'v@t.com' },
  lastUpdatedBy: null,
  client: { id: 'c1', names: 'Ana', first_last_name: 'Perez' },
  unit: { id: 'un1', floor: 2, unit_number: '2A', state: 2, building: {} },
  final_price: 1000,
  currency: 'BOB',
};

function loginAs(id: string, role: string) {
  authMock.mockResolvedValue({ user: { id, role } });
}

describe('sales list visibility by role', () => {
  beforeEach(() => {
    authMock.mockReset();
    findMany.mockReset();
    findMany.mockResolvedValue([sale]);
  });

  it('viewer sees other users sales (no owner filter) but cannot update', async () => {
    loginAs('viewer-1', 'viewer');
    const result: any = await getSalesListAction({});
    expect(result.success).toBe(true);
    expect(result.data.rows).toHaveLength(1);
    expect(result.data.rows[0].canUpdate).toBe(false);
    expect(findMany.mock.calls[0][0].where).toBeUndefined();
  });

  it('viewer can filter by a specific seller', async () => {
    loginAs('viewer-1', 'viewer');
    await getSalesListAction({ userId: 'seller-1' });
    expect(findMany.mock.calls[0][0].where).toBeDefined();
  });

  it('viewer never gets canUpdate even if they own the sale', async () => {
    loginAs('seller-1', 'viewer');
    const result: any = await getSalesListAction({});
    expect(result.data.rows[0].canUpdate).toBe(false);
  });

  it('regular user is filtered to own sales and cannot update others', async () => {
    loginAs('user-1', 'user');
    const result: any = await getSalesListAction({});
    expect(findMany.mock.calls[0][0].where).toBeDefined();
    expect(result.data.rows[0].canUpdate).toBe(false);
  });

  it('owner (role user) can update their own sale', async () => {
    loginAs('seller-1', 'user');
    const result: any = await getSalesListAction({});
    expect(result.data.rows[0].canUpdate).toBe(true);
  });

  it('admin sees everything and can update', async () => {
    loginAs('admin-1', 'admin');
    const result: any = await getSalesListAction({});
    expect(findMany.mock.calls[0][0].where).toBeUndefined();
    expect(result.data.rows[0].canUpdate).toBe(true);
  });
});
