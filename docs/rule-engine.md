# Rule Engine

Location: `src/rules/VisaRuleEngine.ts`

## Configuration

```typescript
{
  enabled: true,
  maxHours: 48,
  rollingWindowDays: 14,
  appliesDuringTeachingPeriods: true,
  unlimitedDuringSemesterBreaks: true,
  researchDegreeUnlimitedAfterCommencement: true,
}
```

## API

| Function | Description |
|----------|-------------|
| `calculateHours` | Sum worked hours in rolling window |
| `calculateProjectedHours` | Include scheduled shifts for forecast |
| `calculateRemainingHours` | Max minus projected |
| `rollingWindow` | Returns [start, end] for reference date |
| `validateShift` | Overlap, duplicate, duration checks |
| `forecastCompliance` | Full compliance result with status |
| `simulateFutureShift` | What-if for a candidate shift |
| `detectFutureViolations` | Find scheduled shifts causing violations |
| `suggestShiftAdjustment` | Reduce, move, delete, or break suggestions |
| `findEarliestAvailableStart` | When a shift of N minutes can start |

## Status thresholds

- **Compliant:** projected ≤ max × (warningPercentage / 100) is false AND projected ≤ max
- **Warning:** projected > warning threshold and ≤ max
- **Violation:** projected > max

## Shift status rules

| Status | Historical hours | Forecast |
|--------|------------------|----------|
| worked | yes | yes |
| scheduled | no | yes (from today forward) |
| cancelled | no | no |
| missed | no | no |

## Tests

Run: `npm test -- --testPathPattern=VisaRuleEngine`

Coverage target: ≥95% for `src/rules/`.
