import type { ActivityLevel, Goal, ProfilePayload, Sex } from '@/lib/schema/profile';

/**
 * Turns a parsed onboarding profile into daily targets. Pure — no dates, no IO —
 * so the same module runs on the server (the API returns the plan) and in tests.
 */

export interface Plan {
  goal: Goal;
  /** Mifflin-St Jeor basal metabolic rate, kcal/day. */
  bmr: number;
  /** Maintenance calories at the reported activity level, kcal/day. */
  tdee: number;
  /** The daily target, rounded to the nearest 10 and never below the floor. */
  calories: number;
  macros: { proteinG: number; fatG: number; carbsG: number };
  /** True when the requested deficit would dip below a safe minimum. */
  flooredToMinimum: boolean;
  targetWeightKg?: number;
  /** Only for lose_weight with a real (post-floor) deficit; one decimal. */
  weeksToTarget?: number;
}

// The formula needs a sex term; for prefer_not_to_say we use the midpoint of
// the two, which is the same as averaging the sexed formulas.
const SEX_TERM: Record<Sex, number> = { male: 5, female: -161, prefer_not_to_say: -78 };

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

/** Below these, a deficit stops being a plan and starts being a problem. */
const CALORIE_FLOOR: Record<Sex, number> = { female: 1200, male: 1500, prefer_not_to_say: 1350 };

const KCAL_PER_KG = 7700;
const SURPLUS_FACTOR = 1.1;
const PROTEIN_G_PER_KG = 1.8;
/** Protein never exceeds 40% of calories, so carbs cannot go negative. */
const PROTEIN_CALORIE_CAP = 0.4;
const FAT_CALORIE_SHARE = 0.25;

const round1 = (value: number) => Math.round(value * 10) / 10;

export function computePlan(profile: ProfilePayload): Plan {
  const { goal, heightCm, weightKg, targetWeightKg, rateKgPerWeek, age, sex, activityLevel } =
    profile;

  const bmrRaw = 10 * weightKg + 6.25 * heightCm - 5 * age + SEX_TERM[sex];
  const tdeeRaw = bmrRaw * ACTIVITY_MULTIPLIER[activityLevel];

  let targetRaw = tdeeRaw;
  if (goal === 'lose_weight' && rateKgPerWeek !== undefined) {
    targetRaw = tdeeRaw - (rateKgPerWeek * KCAL_PER_KG) / 7;
  } else if (goal === 'build_muscle') {
    targetRaw = tdeeRaw * SURPLUS_FACTOR;
  }

  const floor = CALORIE_FLOOR[sex];
  const flooredToMinimum = targetRaw < floor;
  // The floors are multiples of 10, so flooring survives the rounding.
  const calories = Math.round(Math.max(targetRaw, floor) / 10) * 10;

  const proteinG = Math.round(
    Math.min(PROTEIN_G_PER_KG * weightKg, (PROTEIN_CALORIE_CAP * calories) / 4),
  );
  const fatG = Math.round((FAT_CALORIE_SHARE * calories) / 9);
  // Carbs absorb the rounding error so the macros add back up to the target.
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  let weeksToTarget: number | undefined;
  if (goal === 'lose_weight' && targetWeightKg !== undefined && weightKg > targetWeightKg) {
    // Pace from the deficit the user actually gets, not the one they asked for —
    // when the floor kicks in, the honest timeline is longer.
    const effectiveDeficit = tdeeRaw - Math.max(targetRaw, floor);
    if (effectiveDeficit > 0) {
      const effectiveRate = (effectiveDeficit * 7) / KCAL_PER_KG;
      weeksToTarget = round1((weightKg - targetWeightKg) / effectiveRate);
    }
  }

  return {
    goal,
    bmr: Math.round(bmrRaw),
    tdee: Math.round(tdeeRaw),
    calories,
    macros: { proteinG, fatG, carbsG },
    flooredToMinimum,
    targetWeightKg,
    weeksToTarget,
  };
}

/**
 * "March 2027"-style label for a date `weeks` from now. Locale is pinned so the
 * output does not depend on which machine rendered it.
 */
export function targetDateLabel(weeks: number, from: Date = new Date()): string {
  const target = new Date(from);
  target.setDate(target.getDate() + Math.round(weeks * 7));
  return target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
