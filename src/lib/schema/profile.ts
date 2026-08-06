import { z } from 'zod';

/**
 * The single source of truth for the onboarding profile.
 *
 * Number inputs live in form state as strings (that is what a DOM input gives
 * us), so every numeric field is a string on the way in and a number on the way
 * out. The schema is therefore also the unit boundary: the wire carries whatever
 * the user actually typed plus the unit system they picked, and `z.output` is
 * canonical metric. Validating in the user's own units is what lets the error
 * messages talk about pounds when they are entering pounds.
 */

interface NumericOptions {
  min: number;
  max: number;
  int?: boolean;
}

function numeric(label: string, { min, max, int = false }: NumericOptions) {
  let value = z
    .number({ error: `${label} must be a number.` })
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

  if (int) {
    value = value.int(`${label} must be a whole number.`);
  }

  // `Number` rather than `z.coerce.number()`: coercion widens the input type to
  // `unknown`, which cannot be piped from a string.
  return z.string().trim().min(1, `${label} is required.`).transform(Number).pipe(value);
}

function optionalNumeric(label: string, options: NumericOptions) {
  return z
    .union([z.literal(''), numeric(label, options)])
    .transform((value) => (value === '' ? undefined : value));
}

export const GOALS = ['lose_weight', 'build_muscle', 'maintain', 'general_fitness'] as const;
export const SEXES = ['female', 'male', 'prefer_not_to_say'] as const;
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'very_active'] as const;
export const UNIT_SYSTEMS = ['metric', 'imperial'] as const;
/** Weekly weight-loss pace. String values so the draft stays all-string. */
export const RATES = ['0.25', '0.5', '1'] as const;

export type Goal = (typeof GOALS)[number];
export type Sex = (typeof SEXES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];
export type RateChoice = (typeof RATES)[number];

const RATE_VALUES = { '0.25': 0.25, '0.5': 0.5, '1': 1 } as const;

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

const round1 = (value: number) => Math.round(value * 10) / 10;

// Equivalent ranges, expressed in each unit so the messages read naturally.
const KG_RANGE = { min: 25, max: 400 } satisfies NumericOptions;
const LB_RANGE = { min: 55, max: 880 } satisfies NumericOptions;

/**
 * Per-field schemas. The form generator validates one field at a time with
 * these; the wire schema below composes the same pieces.
 */
export const profileFieldSchemas = {
  unitSystem: z.enum(UNIT_SYSTEMS, { error: 'Choose a unit system.' }),
  goal: z.enum(GOALS, { error: 'Choose a goal to continue.' }),
  heightCm: numeric('Height', { min: 90, max: 250 }),
  heightFt: numeric('Height (ft)', { min: 3, max: 8, int: true }),
  heightIn: numeric('Height (in)', { min: 0, max: 11 }),
  weightKg: numeric('Weight', KG_RANGE),
  weightLb: numeric('Weight', LB_RANGE),
  targetWeightKg: numeric('Target weight', KG_RANGE),
  targetWeightLb: numeric('Target weight', LB_RANGE),
  rateKgPerWeek: z.enum(RATES, { error: 'Choose a weekly rate to continue.' }),
  age: numeric('Age', { min: 13, max: 120, int: true }),
  sex: z.enum(SEXES, { error: 'Choose an option to continue.' }),
  activityLevel: z.enum(ACTIVITY_LEVELS, { error: 'Choose an activity level to continue.' }),
} as const;

const optionalRate = z
  .union([z.literal(''), z.enum(RATES, { error: 'Choose a weekly rate to continue.' })])
  .transform((value) => (value === '' ? undefined : RATE_VALUES[value]));

/** Present only when validated above; the check below guarantees it. */
function required(value: number | undefined): number {
  if (value === undefined) throw new Error('Expected a validated measurement.');
  return value;
}

/**
 * Blank out measurements that the chosen unit system and goal make irrelevant,
 * mirroring what `showIf` does in the UI. Without this, a leftover `weightLb`
 * would be range-checked even though metric was selected and the value is about
 * to be thrown away.
 */
function clearInapplicable(raw: unknown) {
  if (typeof raw !== 'object' || raw === null) return raw;

  const value = raw as Record<string, unknown>;
  const drop =
    value.unitSystem === 'imperial'
      ? ['heightCm', 'weightKg', 'targetWeightKg']
      : ['heightFt', 'heightIn', 'weightLb', 'targetWeightLb'];

  if (value.goal !== 'lose_weight') drop.push('targetWeightKg', 'targetWeightLb', 'rateKgPerWeek');

  const next = { ...value };
  for (const key of drop) next[key] = '';
  return next;
}

/**
 * The payload the client posts and the server parses.
 *
 * Every measurement is optional here because which ones apply depends on the
 * chosen unit system and goal. The client expresses those same rules as field
 * visibility; the server re-derives them, since it cannot trust UI state.
 */
const profilePayloadSchema = z
  .object({
    unitSystem: profileFieldSchemas.unitSystem,
    goal: profileFieldSchemas.goal,
    heightCm: optionalNumeric('Height', { min: 90, max: 250 }),
    heightFt: optionalNumeric('Height (ft)', { min: 3, max: 8, int: true }),
    heightIn: optionalNumeric('Height (in)', { min: 0, max: 11 }),
    weightKg: optionalNumeric('Weight', KG_RANGE),
    weightLb: optionalNumeric('Weight', LB_RANGE),
    targetWeightKg: optionalNumeric('Target weight', KG_RANGE),
    targetWeightLb: optionalNumeric('Target weight', LB_RANGE),
    rateKgPerWeek: optionalRate,
    age: profileFieldSchemas.age,
    sex: profileFieldSchemas.sex,
    activityLevel: profileFieldSchemas.activityLevel,
  })
  .check((ctx) => {
    const value = ctx.value;
    const metric = value.unitSystem === 'metric';

    const missing = (path: keyof typeof value, message: string) => {
      ctx.issues.push({ code: 'custom', input: value[path], path: [path], message });
    };

    if (metric) {
      if (value.heightCm === undefined) missing('heightCm', 'Height is required.');
      if (value.weightKg === undefined) missing('weightKg', 'Weight is required.');
    } else {
      if (value.heightFt === undefined) missing('heightFt', 'Height (ft) is required.');
      if (value.heightIn === undefined) missing('heightIn', 'Height (in) is required.');
      if (value.weightLb === undefined) missing('weightLb', 'Weight is required.');
    }

    if (value.goal === 'lose_weight') {
      const target = metric ? value.targetWeightKg : value.targetWeightLb;
      if (target === undefined) {
        missing(
          metric ? 'targetWeightKg' : 'targetWeightLb',
          'Set a target weight so we can pace your plan.',
        );
      }

      if (value.rateKgPerWeek === undefined) {
        missing('rateKgPerWeek', 'Choose how fast you want to lose it.');
      }
    }
  })
  // Hand the server one canonical shape, whatever the user typed in.
  .transform((value) => {
    const metric = value.unitSystem === 'metric';

    const heightCm = metric
      ? required(value.heightCm)
      : round1((required(value.heightFt) * 12 + required(value.heightIn)) * CM_PER_IN);

    const weightKg = metric
      ? required(value.weightKg)
      : round1(required(value.weightLb) * KG_PER_LB);

    const target = metric ? value.targetWeightKg : value.targetWeightLb;
    const targetWeightKg =
      target === undefined ? undefined : metric ? target : round1(target * KG_PER_LB);

    return {
      goal: value.goal,
      unitSystem: value.unitSystem,
      heightCm,
      weightKg,
      targetWeightKg,
      rateKgPerWeek: value.rateKgPerWeek,
      age: value.age,
      sex: value.sex,
      activityLevel: value.activityLevel,
    };
  });

export const profileSchema = z.preprocess(clearInapplicable, profilePayloadSchema);

/** Parsed, server-side shape: canonical metric, numbers are numbers. */
export type ProfilePayload = z.output<typeof profileSchema>;

/**
 * What the wizard holds while it is being filled in. Enum fields start empty,
 * which no finished payload ever is — hence a distinct type rather than
 * `z.input<typeof profileSchema>`.
 */
export type ProfileDraft = {
  unitSystem: UnitSystem;
  goal: Goal | '';
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightKg: string;
  weightLb: string;
  targetWeightKg: string;
  targetWeightLb: string;
  rateKgPerWeek: RateChoice | '';
  age: string;
  sex: Sex | '';
  activityLevel: ActivityLevel | '';
};

export const profileDefaults: ProfileDraft = {
  // The toggle always has a selection; swap this line to default to imperial.
  unitSystem: 'metric',
  goal: '',
  heightCm: '',
  heightFt: '',
  heightIn: '',
  weightKg: '',
  weightLb: '',
  targetWeightKg: '',
  targetWeightLb: '',
  rateKgPerWeek: '',
  age: '',
  sex: '',
  activityLevel: '',
};

/**
 * Inverse of the wire transform: a canonical-metric payload back into an
 * all-string draft in the user's own units, for prefilled edit forms.
 *
 * Total inches are rounded to one decimal BEFORE splitting into ft/in —
 * splitting first lets 91.4 cm (a stored 3'0") decompose as an invalid 2'12".
 * Every payload the forward transform can produce round-trips exactly.
 */
export function draftFromProfile(profile: ProfilePayload): ProfileDraft {
  const draft: ProfileDraft = {
    ...profileDefaults,
    unitSystem: profile.unitSystem,
    goal: profile.goal,
    rateKgPerWeek:
      profile.rateKgPerWeek === undefined ? '' : (String(profile.rateKgPerWeek) as RateChoice),
    age: String(profile.age),
    sex: profile.sex,
    activityLevel: profile.activityLevel,
  };

  if (profile.unitSystem === 'metric') {
    draft.heightCm = String(profile.heightCm);
    draft.weightKg = String(profile.weightKg);
    draft.targetWeightKg =
      profile.targetWeightKg === undefined ? '' : String(profile.targetWeightKg);
  } else {
    const totalIn = round1(profile.heightCm / CM_PER_IN);
    const ft = Math.floor(totalIn / 12);
    draft.heightFt = String(ft);
    draft.heightIn = String(round1(totalIn - ft * 12));
    draft.weightLb = String(round1(profile.weightKg / KG_PER_LB));
    draft.targetWeightLb =
      profile.targetWeightKg === undefined
        ? ''
        : String(round1(profile.targetWeightKg / KG_PER_LB));
  }

  return draft;
}
