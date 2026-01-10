// Authentication and authorization helpers

export type UserRole = 'fedex_admin' | 'fedex_agent' | 'dca_admin' | 'dca_agent';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  dca_id: string | null;
  created_at: string;
  updated_at: string;
}

export function isFedExUser(role: UserRole): boolean {
  return role === 'fedex_admin' || role === 'fedex_agent';
}

export function isDCAUser(role: UserRole): boolean {
  return role === 'dca_admin' || role === 'dca_agent';
}

export function canManageDCAs(role: UserRole): boolean {
  return role === 'fedex_admin';
}

export function canCreateCases(role: UserRole): boolean {
  return isFedExUser(role);
}

export function canCloseCases(role: UserRole): boolean {
  return isFedExUser(role);
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'fedex_admin' || role === 'dca_admin';
}

export function getDefaultRoute(role: UserRole): string {
  if (isFedExUser(role)) {
    return '/fedex';
  }
  return '/dca';
}
