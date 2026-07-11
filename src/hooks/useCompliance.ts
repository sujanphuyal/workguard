import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { profileToUserContext } from '@/database/mappers';
import { employerRepository, semesterBreakRepository, shiftRepository } from '@/database/repositories';
import { QUERY_KEYS } from '@/constants';
import { VisaRuleEngine } from '@/rules/VisaRuleEngine';
import { resolveRuleProfile } from '@/rules/ruleProfiles';
import { useUserId } from '@/hooks/useUser';
import { useAuthStore } from '@/store';
import type { RuleProfile, UserContext } from '@/types';

export function useShifts() {
  const userId = useUserId();
  return useQuery({
    queryKey: [...QUERY_KEYS.shifts, userId],
    queryFn: () => shiftRepository.findAll(userId!),
    enabled: Boolean(userId),
  });
}

export function useEmployers() {
  const userId = useUserId();
  return useQuery({
    queryKey: [...QUERY_KEYS.employers, userId],
    queryFn: () => employerRepository.findAll(userId!),
    enabled: Boolean(userId),
  });
}

export function useSemesterBreaks() {
  const userId = useUserId();
  return useQuery({
    queryKey: [...QUERY_KEYS.semesterBreaks, userId],
    queryFn: () => semesterBreakRepository.findAll(userId!),
    enabled: Boolean(userId),
  });
}

export function useUserContext(): UserContext | null {
  const profile = useAuthStore((s) => s.profile);
  const { data: breaks = [] } = useSemesterBreaks();

  return useMemo(() => {
    if (!profile) return null;
    return profileToUserContext(profile, breaks);
  }, [profile, breaks]);
}

export function useRuleProfile(): RuleProfile {
  const settings = useAuthStore((s) => s.settings);
  return useMemo(
    () => resolveRuleProfile(settings?.maxHours),
    [settings?.maxHours],
  );
}

export function useCompliance() {
  const profile = useAuthStore((s) => s.profile);
  const settings = useAuthStore((s) => s.settings);
  const { data: shifts = [] } = useShifts();
  const { data: breaks = [] } = useSemesterBreaks();
  const ruleProfile = useRuleProfile();

  if (!profile) {
    return null;
  }

  const context = profileToUserContext(profile, breaks);
  const engine = new VisaRuleEngine(
    ruleProfile,
    settings?.warningPercentage ?? 80,
  );
  return engine.forecastCompliance(shifts, new Date(), context);
}

export function useViolatingShiftIds() {
  const profile = useAuthStore((s) => s.profile);
  const { data: shifts = [] } = useShifts();
  const { data: breaks = [] } = useSemesterBreaks();
  const ruleProfile = useRuleProfile();

  return useMemo(() => {
    if (!profile) return new Set<string>();
    const context = profileToUserContext(profile, breaks);
    const engine = new VisaRuleEngine(ruleProfile);
    const violating = engine.detectFutureViolations(shifts, context);
    return new Set(violating.map((s) => s.id));
  }, [profile, shifts, breaks, ruleProfile]);
}

export function useAnalytics() {
  const compliance = useCompliance();
  const { data: shifts = [] } = useShifts();
  const { data: employers = [] } = useEmployers();

  const worked = shifts.filter((s) => s.status === 'worked');
  const byEmployer = employers.map((emp) => ({
    employer: emp,
    hours: worked
      .filter((s) => s.employerId === emp.id)
      .reduce((sum, s) => sum + s.durationMinutes / 60, 0),
  }));

  const weeklyMap = new Map<string, number>();
  worked.forEach((s) => {
    const key = s.startTime.toISOString().slice(0, 10);
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + s.durationMinutes / 60);
  });

  return {
    compliance,
    byEmployer,
    dailyHours: Array.from(weeklyMap.entries()).map(([date, hours]) => ({ date, hours })),
    totalWorked: worked.reduce((sum, s) => sum + s.durationMinutes / 60, 0),
  };
}
