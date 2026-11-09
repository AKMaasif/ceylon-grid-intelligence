import { describe, expect, it } from 'vitest';
import { optimizeFlexibleSchedule, verifyFlexibility } from '../flexibility';

describe('flexibility replay', () => {
  const sample = {
    eventStart: 0,
    eventEnd: 3_600_000,
    measurementEnd: 7_200_000,
    intervals: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
      start: i * 900_000,
      durationMinutes: 15,
      baselineKw: 4,
      observedKw: i < 4 ? 2 : 5,
    })),
  };
  it('integrates interval power and deducts rebound across the complete window', () => {
    expect(verifyFlexibility(sample)).toMatchObject({
      status: 'verified_replay',
      reductionKwh: 2,
      reboundKwh: 1,
      netKwh: 1,
      meanReductionKw: 2,
    });
    expect(verifyFlexibility(sample)).toEqual(verifyFlexibility(structuredClone(sample)));
  });
  it('blocks missing, duplicate, overlapping and partial windows', () => {
    for (const intervals of [
      sample.intervals.slice(1),
      [...sample.intervals, sample.intervals[0]!],
      sample.intervals.map((p, i) => (i === 2 ? { ...p, observedKw: null } : p)),
    ]) {
      expect(verifyFlexibility({ ...sample, intervals })).toMatchObject({
        status: 'insufficient_data',
        netKwh: null,
      });
    }
  });
  it('does not hide a negative event response', () => {
    const result = verifyFlexibility({
      ...sample,
      intervals: sample.intervals.map((p) => ({ ...p, observedKw: 5 })),
    });
    expect(result.reductionKwh).toBe(-1);
    expect(result.netKwh).toBe(-2);
  });
});

describe('finite constrained schedule', () => {
  const input = {
    rates: [30, 30, 10, 10, 40, 40],
    durationMinutes: 15,
    powerKw: 4,
    requiredSlots: 2,
    earliestSlot: 0,
    deadlineSlot: 4,
    baselineStart: 4,
  };
  it('finds a feasible minimum and preserves required energy', () => {
    expect(optimizeFlexibleSchedule(input)).toMatchObject({
      optimizedStart: 2,
      optimizedCost: 20,
      baselineCost: 80,
      timerCost: 60,
      savings: 60,
      energyKwh: 2,
    });
  });
  it('reports infeasibility rather than relaxing the deadline', () => {
    expect(() => optimizeFlexibleSchedule({ ...input, requiredSlots: 5 })).toThrow('Infeasible');
  });
  it('uses actual duration rather than assuming every slot is one hour', () => {
    expect(optimizeFlexibleSchedule({ ...input, durationMinutes: 60 }).energyKwh).toBe(8);
  });
});
