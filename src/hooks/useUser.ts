import { useAuthStore } from '@/store';
import { GUEST_USER_ID } from '@/constants';

export function useUserId(): string | undefined {
  const sessionUserId = useAuthStore((s) => s.session?.user.id);
  const isGuest = useAuthStore((s) => s.isGuest);
  if (sessionUserId) return sessionUserId;
  if (isGuest) return GUEST_USER_ID;
  return undefined;
}

export function useIsGuest(): boolean {
  return useAuthStore((s) => s.isGuest);
}

export function useIsAuthenticated(): boolean {
  const session = useAuthStore((s) => s.session);
  const isGuest = useAuthStore((s) => s.isGuest);
  return Boolean(session) || isGuest;
}
