export function isAdminRole(role: unknown) {
  return String(role ?? '').toLowerCase() === 'admin';
}

export function isViewerRole(role: unknown) {
  return String(role ?? '').toLowerCase() === 'viewer';
}

/** Admin y viewer pueden ver las ventas de todos los usuarios. */
export function canViewAllSales(role: unknown) {
  return isAdminRole(role) || isViewerRole(role);
}

export const VIEWER_READ_ONLY_ERROR =
  'Tu usuario es de solo lectura y no puede realizar esta acción';

export function resolveVisibleSalesUserId(
  requestedUserId: string | undefined,
  currentUserId: string | null,
  canManageAnySale: boolean
) {
  if (!currentUserId) {
    return undefined;
  }

  if (!canManageAnySale) {
    return currentUserId;
  }

  if (requestedUserId && requestedUserId !== 'all') {
    return requestedUserId;
  }

  return undefined;
}

export function resolveClientVisibility(
  currentUserId: string | null,
  canManageAnyClient: boolean
) {
  return {
    ownerUserId:
      !canManageAnyClient && currentUserId ? currentUserId : undefined,
    canManageAnyClient,
  };
}
