import {
  calculateHours,
  calculateProjectedHours,
  calculateRemainingHours,
  detectFutureViolations,
  detectViolation,
  findEarliestAvailableStart,
  forecastCompliance,
  simulateFutureShift,
  suggestShiftAdjustment,
  validateShift,
  VisaRuleEngine,
} from '@/rules/VisaRuleEngine';
import { SUBCLASS_500_DEFAULT } from '@/rules/ruleProfiles';

import { createContext, createDailyShifts, createShift, TZ } from './helpers';

describe('VisaRuleEngine', () => {
  const profile = SUBCLASS_500_DEFAULT;
  const asOf = new Date('2026-03-15T12:00:00+11:00');
  const context = createContext();

  describe('calculateHours — rolling 14-day window', () => {
    it('sums worked hours within rolling window only', () => {
      const shifts = [
        ...createDailyShifts('2026-03-02T09:00:00+11:00', 14, 3),
        createShift('2026-03-01T09:00:00+11:00', 8, { id: 'old' }),
      ];
      expect(calculateHours(shifts, asOf, context, profile)).toBe(42);
    });

    it('ignores cancelled and missed shifts', () => {
      const shifts = [
        createShift('2026-03-10T09:00:00+11:00', 8, { status: 'cancelled' }),
        createShift('2026-03-11T09:00:00+11:00', 8, { status: 'missed' }),
        createShift('2026-03-12T09:00:00+11:00', 8, { status: 'worked' }),
      ];
      expect(calculateHours(shifts, asOf, context, profile)).toBe(8);
    });
  });

  describe('boundary hours', () => {
    it('47.5 hours is warning at 80% threshold but under max', () => {
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 10, 4.75);
      const result = forecastCompliance(shifts, asOf, context, profile, 80);
      expect(result.projectedHours).toBe(47.5);
      expect(result.status).toBe('warning');
    });

    it('48 hours is warning at 80% threshold', () => {
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 12, 4);
      const result = forecastCompliance(shifts, asOf, context, profile, 80);
      expect(result.projectedHours).toBe(48);
      expect(result.status).toBe('warning');
    });

    it('48.01 hours is violation', () => {
      const shifts = [
        ...createDailyShifts('2026-03-02T09:00:00+11:00', 12, 4),
        createShift('2026-03-14T09:00:00+11:00', 0.01),
      ];
      const result = forecastCompliance(shifts, asOf, context, profile, 80);
      expect(result.projectedHours).toBeCloseTo(48.01, 2);
      expect(result.status).toBe('violation');
      expect(detectViolation(result.projectedHours, profile, context, asOf)).toBe(true);
    });
  });

  describe('overnight shifts', () => {
    it('counts overnight shift duration correctly', () => {
      const shift = createShift('2026-03-14T22:00:00+11:00', 8, {
        endTime: new Date('2026-03-15T06:00:00+11:00'),
        durationMinutes: 480,
      });
      expect(calculateHours([shift], asOf, context, profile)).toBe(8);
    });
  });

  describe('semester breaks', () => {
    it('does not enforce limit during semester break', () => {
      const breakContext = createContext({
        semesterBreaks: [
          {
            start: new Date('2026-03-01T00:00:00+11:00'),
            end: new Date('2026-03-31T23:59:59+11:00'),
          },
        ],
      });
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 14, 8);
      const result = forecastCompliance(shifts, asOf, breakContext, profile);
      expect(result.isUnlimited).toBe(true);
      expect(result.status).toBe('compliant');
    });
  });

  describe('research students', () => {
    it('unlimited after course commencement for PhD', () => {
      const researchContext = createContext({
        courseType: 'phd',
        courseCommencementDate: new Date('2026-01-01T00:00:00+11:00'),
      });
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 14, 10);
      const result = forecastCompliance(shifts, asOf, researchContext, profile);
      expect(result.isUnlimited).toBe(true);
    });

    it('enforces limit before course commencement for research student', () => {
      const researchContext = createContext({
        courseType: 'phd',
        courseCommencementDate: new Date('2026-06-01T00:00:00+11:00'),
      });
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 14, 4);
      const hours = calculateProjectedHours(shifts, asOf, researchContext, profile);
      expect(hours).toBe(56);
      expect(detectViolation(hours, profile, researchContext, asOf)).toBe(true);
    });
  });

  describe('forecasting with scheduled shifts', () => {
    it('includes future scheduled shifts in projection when within window', () => {
      const forecastDate = new Date('2026-03-13T08:00:00+11:00');
      const shifts = [
        createShift('2026-03-10T09:00:00+11:00', 20, { status: 'worked' }),
        createShift('2026-03-13T14:00:00+11:00', 28, { status: 'scheduled' }),
      ];
      const projected = calculateProjectedHours(shifts, forecastDate, context, profile);
      expect(projected).toBe(48);
    });
  });

  describe('validateShift', () => {
    it('detects overlap and duplicate', () => {
      const existing = createShift('2026-03-10T09:00:00+11:00', 4, { id: 'e1' });
      const overlap = createShift('2026-03-10T11:00:00+11:00', 4, { id: 'e2' });
      const duplicate = createShift('2026-03-10T09:00:00+11:00', 4, { id: 'e3' });

      expect(validateShift(overlap, [existing], context).some((e) => e.code === 'overlap')).toBe(
        true,
      );
      expect(
        validateShift(duplicate, [existing], context).some((e) => e.code === 'duplicate'),
      ).toBe(true);
    });

    it('rejects end before start', () => {
      const bad = createShift('2026-03-10T09:00:00+11:00', -2);
      expect(validateShift(bad, [], context).some((e) => e.code === 'end_before_start')).toBe(
        true,
      );
    });
  });

  describe('future violations and suggestions', () => {
    it('detects violating scheduled shifts within window', () => {
      const forecastDate = new Date('2026-03-12T08:00:00+11:00');
      const shifts = [
        ...createDailyShifts('2026-03-02T09:00:00+11:00', 10, 4),
        createShift('2026-03-12T14:00:00+11:00', 9, { id: 'future', status: 'scheduled' }),
      ];
      const violations = detectFutureViolations(shifts, context, profile, forecastDate);
      expect(violations.length).toBeGreaterThan(0);
    });

    it('suggests adjustments for violating shift', () => {
      const violating = createShift('2026-03-20T09:00:00+11:00', 10, {
        id: 'v1',
        status: 'scheduled',
      });
      const shifts = [...createDailyShifts('2026-03-02T09:00:00+11:00', 12, 4), violating];
      const suggestions = suggestShiftAdjustment(shifts, violating, context, profile, asOf);
      expect(suggestions.some((s) => s.type === 'delete_shift')).toBe(true);
    });
  });

  describe('nextAvailableHour and findEarliestAvailableStart', () => {
    it('returns remaining hours', () => {
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 10, 4);
      expect(calculateRemainingHours(shifts, asOf, context, profile)).toBe(8);
    });

    it('finds earliest available start after violation clears', () => {
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 12, 4);
      const earliest = findEarliestAvailableStart(shifts, 120, context, profile, asOf);
      expect(earliest).toBeInstanceOf(Date);
    });
  });

  describe('DST transitions', () => {
    it('handles spring-forward in Melbourne', () => {
      const dstDate = new Date('2026-10-04T12:00:00+11:00');
      const shifts = createDailyShifts('2026-09-28T09:00:00+10:00', 7, 6);
      const hours = calculateHours(shifts, dstDate, context, profile);
      expect(hours).toBe(42);
    });
  });

  describe('peak rolling window across future fortnights', () => {
    it('flags violation when back-to-back fortnights exceed limit even if today looks compliant', () => {
      const forecastDate = new Date('2026-03-02T09:00:00+11:00');
      const week1 = createDailyShifts('2026-03-02T09:00:00+11:00', 7, 48 / 7).map((s) => ({
        ...s,
        status: 'worked' as const,
      }));
      const week2scheduled = createDailyShifts('2026-03-09T09:00:00+11:00', 7, 48 / 7).map(
        (s, i) => ({
          ...s,
          id: `w2-${i}`,
          status: 'scheduled' as const,
        }),
      );
      const shifts = [...week1, ...week2scheduled];
      const result = forecastCompliance(shifts, forecastDate, context, profile, 80);
      expect(result.peakProjectedHours).toBeGreaterThan(48);
      expect(result.status).toBe('violation');
      expect(result.hasFutureWindowViolation).toBe(true);
      expect(detectFutureViolations(shifts, context, profile, forecastDate).length).toBeGreaterThan(
        0,
      );
    });
  });

  describe('VisaRuleEngine class', () => {
    it('delegates to module functions', () => {
      const engine = new VisaRuleEngine(profile, 80);
      const shifts = createDailyShifts('2026-03-02T09:00:00+11:00', 5, 4);
      expect(engine.calculateHours(shifts, asOf, context)).toBe(20);
      expect(engine.forecastCompliance(shifts, asOf, context).status).toBe('compliant');
    });
  });
});
