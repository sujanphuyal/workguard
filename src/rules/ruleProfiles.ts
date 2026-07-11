import type { RuleProfile } from '@/types';

export const SUBCLASS_500_DEFAULT: RuleProfile = {
  id: 'subclass_500_default',
  name: 'Student Visa (Subclass 500) — Default',
  enabled: true,
  maxHours: 48,
  rollingWindowDays: 14,
  appliesDuringTeachingPeriods: true,
  unlimitedDuringSemesterBreaks: true,
  researchDegreeUnlimitedAfterCommencement: true,
};

export const RULE_PROFILES: Record<string, RuleProfile> = {
  [SUBCLASS_500_DEFAULT.id]: SUBCLASS_500_DEFAULT,
};

export function getRuleProfile(id: string = SUBCLASS_500_DEFAULT.id): RuleProfile {
  return RULE_PROFILES[id] ?? SUBCLASS_500_DEFAULT;
}

export function resolveRuleProfile(maxHours?: number): RuleProfile {
  const hours = maxHours ?? SUBCLASS_500_DEFAULT.maxHours;
  return {
    ...SUBCLASS_500_DEFAULT,
    maxHours: Math.max(1, hours),
  };
}
