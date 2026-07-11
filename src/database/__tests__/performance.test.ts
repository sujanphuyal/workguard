import { createDailyShifts } from '@/rules/__tests__/helpers';

describe('Shift list performance', () => {
  it('filters and sorts 20,000 shifts under 500ms', () => {
    const shifts = createDailyShifts('2020-01-01T09:00:00+11:00', 20000, 4);

    const start = Date.now();
    const filtered = shifts
      .filter((s) => s.status === 'worked')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 100);
    const elapsed = Date.now() - start;

    expect(filtered.length).toBe(100);
    expect(elapsed).toBeLessThan(500);
  });
});
