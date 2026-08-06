import { describe, expect, it } from 'vitest';
import { computePlan, targetDateLabel } from './plan';
import type { ProfilePayload } from './schema/profile';

/** 80 kg, 180 cm, age 30 — the hand-computed reference profile. */
function profile(overrides: Partial<ProfilePayload> = {}): ProfilePayload {
  return {
    unitSystem: 'metric',
    goal: 'maintain',
    heightCm: 180,
    weightKg: 80,
    targetWeightKg: undefined,
    rateKgPerWeek: undefined,
    age: 30,
    sex: 'male',
    activityLevel: 'moderate',
    ...overrides,
  };
}

describe('computePlan — BMR', () => {
  // 10*80 + 6.25*180 - 5*30 = 1775, then the sex term.
  it('applies Mifflin-St Jeor per sex', () => {
    expect(computePlan(profile()).bmr).toBe(1780);
    expect(computePlan(profile({ sex: 'female' })).bmr).toBe(1614);
    expect(computePlan(profile({ sex: 'prefer_not_to_say' })).bmr).toBe(1697);
  });

  it('undisclosed sex is the exact average of the sexed formulas', () => {
    const male = computePlan(profile()).bmr;
    const female = computePlan(profile({ sex: 'female' })).bmr;
    const undisclosed = computePlan(profile({ sex: 'prefer_not_to_say' })).bmr;
    expect(undisclosed).toBe((male + female) / 2);
  });
});

describe('computePlan — TDEE', () => {
  it.each([
    ['sedentary', 2136],
    ['light', 2448],
    ['moderate', 2759],
    ['very_active', 3071],
  ] as const)('%s multiplier', (activityLevel, expected) => {
    expect(computePlan(profile({ activityLevel })).tdee).toBe(expected);
  });
});

describe('computePlan — goal adjustment', () => {
  it('maintains for maintain and general_fitness', () => {
    expect(computePlan(profile()).calories).toBe(2760);
    expect(computePlan(profile({ goal: 'general_fitness' })).calories).toBe(2760);
  });

  it.each([
    [0.25, 2480],
    [0.5, 2210],
    [1, 1660],
  ] as const)('deficit for rate %s kg/week', (rateKgPerWeek, expected) => {
    const plan = computePlan(profile({ goal: 'lose_weight', targetWeightKg: 72, rateKgPerWeek }));
    expect(plan.calories).toBe(expected);
    expect(plan.flooredToMinimum).toBe(false);
  });

  it('adds a 10% surplus for build_muscle', () => {
    expect(computePlan(profile({ goal: 'build_muscle' })).calories).toBe(3030);
  });
});

describe('computePlan — safety floor', () => {
  const small = profile({
    goal: 'lose_weight',
    heightCm: 150,
    weightKg: 45,
    targetWeightKg: 43,
    rateKgPerWeek: 1,
    age: 60,
    sex: 'female',
    activityLevel: 'sedentary',
  });

  it('never goes below the floor', () => {
    const plan = computePlan(small);
    expect(plan.calories).toBe(1200);
    expect(plan.flooredToMinimum).toBe(true);
    // The floor exceeds TDEE here, so no deficit exists and no timeline is honest.
    expect(plan.weeksToTarget).toBeUndefined();
  });

  it('stretches the timeline when the floor shrinks the deficit', () => {
    // 60 kg female, sedentary: tdeeRaw ~ 1595. Rate 1 kg/wk wants 1100/day but
    // only 395/day fits above the 1200 floor.
    const plan = computePlan(
      profile({
        goal: 'lose_weight',
        heightCm: 160,
        weightKg: 60,
        targetWeightKg: 55,
        rateKgPerWeek: 1,
        sex: 'female',
        activityLevel: 'sedentary',
      }),
    );
    expect(plan.flooredToMinimum).toBe(true);
    expect(plan.calories).toBe(1200);
    expect(plan.weeksToTarget).toBeGreaterThan(5); // naive 5 kg / 1 kg-per-week
  });
});

describe('computePlan — macros', () => {
  it('protein by weight, fat at 25%, carbs absorb the remainder', () => {
    const plan = computePlan(profile());
    expect(plan.macros.proteinG).toBe(144); // 1.8 * 80
    expect(plan.macros.fatG).toBe(Math.round((0.25 * plan.calories) / 9));
    const kcal = plan.macros.proteinG * 4 + plan.macros.fatG * 9 + plan.macros.carbsG * 4;
    expect(Math.abs(kcal - plan.calories)).toBeLessThanOrEqual(10);
  });

  it('caps protein so carbs never go negative for heavy floored users', () => {
    const plan = computePlan(
      profile({
        goal: 'lose_weight',
        weightKg: 180,
        targetWeightKg: 100,
        rateKgPerWeek: 1,
        sex: 'female',
        activityLevel: 'sedentary',
      }),
    );
    expect(plan.macros.proteinG * 4).toBeLessThanOrEqual(0.4 * plan.calories + 2);
    expect(plan.macros.carbsG).toBeGreaterThanOrEqual(0);
  });
});

describe('computePlan — timeline', () => {
  it('80 to 72 kg at 0.5 kg/week is 16 weeks', () => {
    const plan = computePlan(
      profile({ goal: 'lose_weight', targetWeightKg: 72, rateKgPerWeek: 0.5 }),
    );
    expect(plan.weeksToTarget).toBe(16);
  });

  it('omits the timeline when already at target', () => {
    const plan = computePlan(
      profile({ goal: 'lose_weight', targetWeightKg: 80, rateKgPerWeek: 0.5 }),
    );
    expect(plan.weeksToTarget).toBeUndefined();
  });
});

describe('targetDateLabel', () => {
  it('formats a pinned-locale month and year', () => {
    expect(targetDateLabel(16, new Date('2026-01-01T00:00:00'))).toBe('April 2026');
  });
});
