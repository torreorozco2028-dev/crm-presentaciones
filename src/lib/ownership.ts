export function isAdminRole(role: unknown) {
  return String(role ?? '').toLowerCase() === 'admin';
}

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
