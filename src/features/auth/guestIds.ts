import { GUEST_USER_ID } from '@/constants';

export function isGuestUserId(userId: string | undefined | null): boolean {
  return userId === GUEST_USER_ID;
}

export { GUEST_USER_ID };
