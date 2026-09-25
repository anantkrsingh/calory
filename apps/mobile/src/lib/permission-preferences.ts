import { storage } from '@/lib/storage';

export type PermissionKind = 'activity' | 'notifications';
export type PermissionChoice = 'allowed' | 'denied';

const keyFor = (kind: PermissionKind): string => `permission:${kind}:choice`;

export function getPermissionChoice(kind: PermissionKind): PermissionChoice | null {
  const value = storage.getString(keyFor(kind));
  return value === 'allowed' || value === 'denied' ? value : null;
}

export function setPermissionChoice(
  kind: PermissionKind,
  choice: PermissionChoice,
): void {
  storage.set(keyFor(kind), choice);
}

export function clearPermissionChoice(kind: PermissionKind): void {
  storage.remove(keyFor(kind));
}
