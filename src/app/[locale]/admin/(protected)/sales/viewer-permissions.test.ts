import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, dbTouched } = vi.hoisted(() => ({
  authMock: vi.fn(),
  dbTouched: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/auth', () => ({ auth: () => authMock() }));
vi.mock('@/server/services/sale-control', () => ({
  loadSalePayment: vi.fn(),
  registerSalePayment: vi.fn(),
  removeSalePayment: vi.fn(),
  saveSaleControl: vi.fn(),
}));
vi.mock('@/server/db/entities/clients', () => ({
  default: class {
    createClient = dbTouched;
  },
}));
// Cualquier acceso a la base de datos queda registrado en dbTouched.
vi.mock('@/server/db/config', () => {
  const handler: ProxyHandler<object> = {
    get: (_t, prop) => {
      dbTouched(String(prop));
      return new Proxy(() => {}, handler);
    },
    apply: () => {
      dbTouched('call');
      return new Proxy(() => {}, handler);
    },
  };
  return { db: new Proxy({}, handler) };
});

import {
  addSaleCommentAction,
  createSaleAction,
  deleteSaleAction,
  registerClientAction,
  updateSaleAction,
  updateUnitStateAction,
} from './actions';
import { createClientAction, updateClientAction } from '../clients/actions';

const READ_ONLY = 'solo lectura';

function loginAs(role: string) {
  authMock.mockResolvedValue({
    user: { id: 'u1', role, name: 'Test', email: 't@t.com' },
  });
}

describe('viewer role is read-only on the server', () => {
  beforeEach(() => {
    authMock.mockReset();
    dbTouched.mockClear();
    loginAs('viewer');
  });

  const writes: Array<[string, () => Promise<any>]> = [
    ['registerClientAction', () => registerClientAction({ names: 'a' })],
    [
      'createSaleAction',
      () =>
        createSaleAction({
          clientId: 'c',
          unitId: 'un',
          state: 2,
        } as any),
    ],
    ['updateUnitStateAction', () => updateUnitStateAction('un', 2)],
    ['updateSaleAction', () => updateSaleAction({ saleId: 's' } as any)],
    ['deleteSaleAction', () => deleteSaleAction('s')],
    [
      'addSaleCommentAction',
      () => addSaleCommentAction({ saleId: 's', comment: 'hola' }),
    ],
    ['createClientAction', () => createClientAction({ names: 'a' } as any)],
    ['updateClientAction', () => updateClientAction({ id: 'c' } as any)],
  ];

  it.each(writes)('%s is rejected without touching the db', async (_n, run) => {
    const result = await run();
    expect(result.success).toBe(false);
    expect(result.error).toContain(READ_ONLY);
    expect(dbTouched).not.toHaveBeenCalled();
  });

  it('regular user is NOT blocked by the viewer guard', async () => {
    loginAs('user');
    const result = await deleteSaleAction('');
    expect(result.error ?? '').not.toContain(READ_ONLY);
  });

  it('admin is NOT blocked by the viewer guard', async () => {
    loginAs('admin');
    const result = await deleteSaleAction('');
    expect(result.error ?? '').not.toContain(READ_ONLY);
  });
});
