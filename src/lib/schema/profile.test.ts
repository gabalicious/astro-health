import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { draftFromProfile, type ProfileDraft, profileSchema } from './profile';

/** A complete, valid metric draft; override per test. */
function draft(overrides: Partial<ProfileDraft> = {}): ProfileDraft {
  return {
    unitSystem: 'metric',
    goal: 'lose_weight',
    heightCm: '180',
    heightFt: '',
    heightIn: '',
    weightKg: '80',
    weightLb: '',
    targetWeightKg: '72',
    targetWeightLb: '',
    rateKgPerWeek: '0.5',
    age: '30',
    sex: 'male',
    activityLevel: 'moderate',
    ...overrides,
  };
}

const errorsOf = (result: { error?: z.ZodError }): Record<string, string[] | undefined> =>
  result.error ? z.flattenError(result.error).fieldErrors : {};

describe('profileSchema — metric', () => {
  it('parses strings into a canonical numeric payload', () => {
    const result = profileSchema.safeParse(draft());
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      goal: 'lose_weight',
      unitSystem: 'metric',
      heightCm: 180,
      weightKg: 80,
      targetWeightKg: 72,
      rateKgPerWeek: 0.5,
      age: 30,
    });
  });

  it('speaks kilograms when validating kilograms', () => {
    const result = profileSchema.safeParse(draft({ weightKg: '20' }));
    expect(errorsOf(result).weightKg).toEqual(['Weight must be at least 25.']);
  });

  it('rejects a fractional age', () => {
    const result = profileSchema.safeParse(draft({ age: '29.5' }));
    expect(errorsOf(result).age).toEqual(['Age must be a whole number.']);
  });

  it('rejects an unknown unit system', () => {
    const result = profileSchema.safeParse(draft({ unitSystem: 'stone' as never }));
    expect(errorsOf(result).unitSystem).toEqual(['Choose a unit system.']);
  });
});

describe('profileSchema — imperial', () => {
  const imperial = (overrides: Partial<ProfileDraft> = {}) =>
    draft({
      unitSystem: 'imperial',
      heightCm: '',
      weightKg: '',
      targetWeightKg: '',
      heightFt: '5',
      heightIn: '11',
      weightLb: '194',
      targetWeightLb: '175',
      ...overrides,
    });

  it('converts to canonical metric exactly', () => {
    const result = profileSchema.safeParse(imperial());
    expect(result.success).toBe(true);
    // (5*12 + 11) * 2.54 = 180.34 -> 180.3; 194 lb -> 87.9969... -> 88
    expect(result.data?.heightCm).toBe(180.3);
    expect(result.data?.weightKg).toBe(88);
    expect(result.data?.targetWeightKg).toBe(79.4);
  });

  it('speaks pounds when validating pounds', () => {
    const result = profileSchema.safeParse(imperial({ weightLb: '900' }));
    expect(errorsOf(result).weightLb).toEqual(['Weight must be at most 880.']);
  });

  it('requires all imperial measurements', () => {
    const result = profileSchema.safeParse(imperial({ heightFt: '', heightIn: '', weightLb: '' }));
    const errors = errorsOf(result);
    expect(errors.heightFt).toEqual(['Height (ft) is required.']);
    expect(errors.heightIn).toEqual(['Height (in) is required.']);
    expect(errors.weightLb).toEqual(['Weight is required.']);
  });
});

describe('profileSchema — required-when rules', () => {
  it('requires target weight and rate for lose_weight', () => {
    const result = profileSchema.safeParse(draft({ targetWeightKg: '', rateKgPerWeek: '' }));
    const errors = errorsOf(result);
    expect(errors.targetWeightKg).toEqual(['Set a target weight so we can pace your plan.']);
    expect(errors.rateKgPerWeek).toEqual(['Choose how fast you want to lose it.']);
  });

  it('does not require them for other goals', () => {
    const result = profileSchema.safeParse(
      draft({ goal: 'maintain', targetWeightKg: '', rateKgPerWeek: '' }),
    );
    expect(result.success).toBe(true);
  });
});

describe('profileSchema — clearInapplicable', () => {
  it('ignores stale imperial values when metric is selected', () => {
    const result = profileSchema.safeParse(draft({ weightLb: '9999' }));
    expect(result.success).toBe(true);
    expect(result.data?.weightKg).toBe(80);
  });

  it('ignores stale target and rate when the goal does not need them', () => {
    const result = profileSchema.safeParse(
      draft({ goal: 'maintain', targetWeightKg: '10', rateKgPerWeek: '1' }),
    );
    expect(result.success).toBe(true);
    expect(result.data?.targetWeightKg).toBeUndefined();
    expect(result.data?.rateKgPerWeek).toBeUndefined();
  });
});

describe('draftFromProfile', () => {
  it('round-trips a metric payload exactly', () => {
    const payload = profileSchema.parse(draft());
    const revived = draftFromProfile(payload);

    expect(revived).toMatchObject({
      unitSystem: 'metric',
      goal: 'lose_weight',
      heightCm: '180',
      weightKg: '80',
      targetWeightKg: '72',
      rateKgPerWeek: '0.5',
      age: '30',
      heightFt: '',
      weightLb: '',
    });
    expect(profileSchema.parse(revived)).toEqual(payload);
  });

  it('round-trips an imperial payload exactly', () => {
    const payload = profileSchema.parse(
      draft({
        unitSystem: 'imperial',
        heightCm: '',
        weightKg: '',
        targetWeightKg: '',
        heightFt: '5',
        heightIn: '11',
        weightLb: '194',
        targetWeightLb: '175',
      }),
    );
    const revived = draftFromProfile(payload);

    expect(revived).toMatchObject({
      unitSystem: 'imperial',
      heightFt: '5',
      heightIn: '11',
      weightLb: '194',
      targetWeightLb: '175',
      heightCm: '',
      weightKg: '',
    });
    expect(profileSchema.parse(revived)).toEqual(payload);
  });

  it('splits 91.4 cm as 3 ft 0 in, not 2 ft 12 in', () => {
    // Regression: total inches must be rounded to one decimal BEFORE the ft/in
    // split. 91.4 / 2.54 = 35.98..., and flooring that puts 12 in the inch box.
    const payload = profileSchema.parse(
      draft({
        unitSystem: 'imperial',
        goal: 'maintain',
        heightCm: '',
        weightKg: '',
        targetWeightKg: '',
        rateKgPerWeek: '',
        heightFt: '3',
        heightIn: '0',
        weightLb: '80',
      }),
    );
    expect(payload.heightCm).toBe(91.4);

    const revived = draftFromProfile(payload);
    expect(revived.heightFt).toBe('3');
    expect(revived.heightIn).toBe('0');
    expect(profileSchema.parse(revived)).toEqual(payload);
  });

  it('leaves target and rate empty for goals that do not use them', () => {
    const payload = profileSchema.parse(
      draft({ goal: 'maintain', targetWeightKg: '', rateKgPerWeek: '' }),
    );
    const revived = draftFromProfile(payload);

    expect(revived.targetWeightKg).toBe('');
    expect(revived.rateKgPerWeek).toBe('');
    expect(profileSchema.parse(revived)).toEqual(payload);
  });
});
