import { addDays } from 'date-fns';

export function defaultProspectiveFriday(): Date {
  const date = new Date();
  const day = date.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  return addDays(date, daysUntilFriday);
}
