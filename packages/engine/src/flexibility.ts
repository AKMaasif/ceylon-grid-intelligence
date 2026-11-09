import { z } from 'zod';
import { canonicalJson, fnv1a64 } from './hash';

export const FlexIntervalSchema = z.object({
  start: z.number().int(),
  durationMinutes: z.number().positive().max(60),
  baselineKw: z.number().nonnegative(),
  observedKw: z.number().nonnegative().nullable(),
});
export const FlexVerificationInputSchema = z
  .object({
    intervals: z.array(FlexIntervalSchema).min(1),
    eventStart: z.number().int(),
    eventEnd: z.number().int(),
    measurementEnd: z.number().int(),
  })
  .superRefine((v, ctx) => {
    if (v.eventEnd <= v.eventStart || v.measurementEnd < v.eventEnd) {
      ctx.addIssue({ code: 'custom', message: 'Invalid event window' });
    }
  });
export type FlexVerificationInput = z.infer<typeof FlexVerificationInputSchema>;

/** Synthetic replay accounting, not causal attribution or a settlement baseline. */
export function verifyFlexibility(raw: FlexVerificationInput) {
  const input = FlexVerificationInputSchema.parse(raw);
  const sorted = [...input.intervals].sort((a, b) => a.start - b.start);
  let cursor = input.eventStart;
  let reductionKwh = 0;
  let reboundKwh = 0;
  let missing = false;
  for (const interval of sorted) {
    const end = interval.start + interval.durationMinutes * 60_000;
    if (end <= input.eventStart || interval.start >= input.measurementEnd) continue;
    if (
      interval.start !== cursor ||
      end > input.measurementEnd ||
      (interval.start < input.eventEnd && end > input.eventEnd)
    )
      missing = true;
    cursor = end;
    if (interval.observedKw === null) {
      missing = true;
      continue;
    }
    const difference =
      ((interval.baselineKw - interval.observedKw) * interval.durationMinutes) / 60;
    if (interval.start < input.eventEnd) reductionKwh += difference;
    else reboundKwh += Math.max(0, -difference);
  }
  if (cursor !== input.measurementEnd) missing = true;
  return {
    id: `FLEX-${fnv1a64(canonicalJson(input))}`,
    status: missing ? ('insufficient_data' as const) : ('verified_replay' as const),
    reductionKwh: missing ? null : reductionKwh,
    reboundKwh: missing ? null : reboundKwh,
    netKwh: missing ? null : reductionKwh - reboundKwh,
    meanReductionKw: missing
      ? null
      : reductionKwh / ((input.eventEnd - input.eventStart) / 3_600_000),
    modelVersion: 'fixture-baseline-v1',
  };
}

export const ScheduleInputSchema = z.object({
  rates: z.array(z.number().nonnegative()).min(1),
  durationMinutes: z.number().positive().max(60),
  powerKw: z.number().positive(),
  requiredSlots: z.number().int().positive(),
  earliestSlot: z.number().int().nonnegative(),
  deadlineSlot: z.number().int().positive(),
  baselineStart: z.number().int().nonnegative(),
});
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

/** Exhaustive optimum over allowed contiguous starts for one fixed-power load. */
export function optimizeFlexibleSchedule(raw: ScheduleInput) {
  const input = ScheduleInputSchema.parse(raw);
  const {
    rates,
    powerKw,
    requiredSlots,
    durationMinutes,
    earliestSlot,
    deadlineSlot,
    baselineStart,
  } = input;
  const latest = Math.min(deadlineSlot, rates.length) - requiredSlots;
  if (earliestSlot > latest || baselineStart + requiredSlots > rates.length) {
    throw new Error('Infeasible service window');
  }
  const costAt = (start: number) =>
    rates
      .slice(start, start + requiredSlots)
      .reduce((sum, rate) => sum + (rate * powerKw * durationMinutes) / 60, 0);
  let bestStart = earliestSlot;
  for (let start = earliestSlot + 1; start <= latest; start++) {
    if (costAt(start) < costAt(bestStart)) bestStart = start;
  }
  return {
    id: `SCHEDULE-${fnv1a64(canonicalJson(input))}`,
    baselineStart,
    timerStart: earliestSlot,
    optimizedStart: bestStart,
    baselineCost: costAt(baselineStart),
    timerCost: costAt(earliestSlot),
    optimizedCost: costAt(bestStart),
    savings: costAt(baselineStart) - costAt(bestStart),
    energyKwh: (powerKw * requiredSlots * durationMinutes) / 60,
    status: 'optimal' as const,
    modelVersion: 'contiguous-load-v1',
  };
}
