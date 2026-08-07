import { z } from 'zod';
import { exerciseOptions } from '@/lib/data/exercises';
import type { FieldConfig } from '@/lib/forms/types';
import { computePlan, type Plan } from '@/lib/plan';
import { numeric } from '@/lib/schema/numeric';
import type { ProfilePayload } from '@/lib/schema/profile';
import { type SetDraft, setDefaults, workoutFieldSchemas } from '@/lib/schema/workout';
import type { LoggedWorkout } from '@/server/store';

/**
 * Everything the /design pages show, defined once so the Vue and Svelte
 * galleries are content-identical. Any difference you can see between the two
 * pages is a difference between the kits — which is the point of the page.
 */

// ---------------------------------------------------------------------------
// Tokens

export interface TokenSwatch {
  label: string;
  /** CSS custom property for the swatch background, e.g. '--primary'. */
  bg: string;
  /** Paired foreground var; when present the swatch shows "Aa" in it. */
  fg?: string;
}

export const TOKEN_GROUPS: readonly { title: string; tokens: readonly TokenSwatch[] }[] = [
  {
    title: 'Surfaces',
    tokens: [
      { label: 'background', bg: '--background', fg: '--foreground' },
      { label: 'card', bg: '--card', fg: '--card-foreground' },
      { label: 'popover', bg: '--popover', fg: '--popover-foreground' },
      { label: 'muted', bg: '--muted', fg: '--muted-foreground' },
      { label: 'accent', bg: '--accent', fg: '--accent-foreground' },
      { label: 'secondary', bg: '--secondary', fg: '--secondary-foreground' },
    ],
  },
  {
    title: 'Brand & feedback',
    tokens: [
      { label: 'primary', bg: '--primary', fg: '--primary-foreground' },
      { label: 'destructive', bg: '--destructive', fg: '--destructive-foreground' },
    ],
  },
  {
    title: 'Lines & focus',
    tokens: [
      { label: 'border', bg: '--border' },
      { label: 'input', bg: '--input' },
      { label: 'ring', bg: '--ring' },
    ],
  },
  {
    title: 'Charts',
    tokens: [1, 2, 3, 4, 5].map((n) => ({ label: `chart-${n}`, bg: `--chart-${n}` })),
  },
];

// ---------------------------------------------------------------------------
// Button showcase lists

export const VUE_BUTTON_VARIANTS = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
] as const;

export const VUE_BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const;

export const SVELTE_BUTTON_VARIANTS = ['default', 'ghost'] as const;

// ---------------------------------------------------------------------------
// Demo form — one field per kind, plus the repeater

export type GalleryDraft = {
  fullName: string;
  email: string;
  password: string;
  weightKg: string;
  exerciseId: string;
  goal: string;
  unitSystem: string;
  terms: string;
  sets: SetDraft[];
};

export const galleryDefaults: GalleryDraft = {
  fullName: '',
  email: '',
  password: '',
  weightKg: '',
  exerciseId: '',
  goal: '',
  unitSystem: 'metric',
  terms: '',
  sets: [{ ...setDefaults }],
};

export const GALLERY_FIELDS: readonly FieldConfig<GalleryDraft>[] = [
  {
    name: 'fullName',
    kind: 'text',
    label: 'Text',
    hint: 'A plain text field.',
    placeholder: 'Ada Lovelace',
    schema: z.string().min(1, 'Enter your name.'),
  },
  {
    name: 'email',
    kind: 'email',
    label: 'Email',
    span: 'half',
    placeholder: 'you@example.com',
    autocomplete: 'email',
    schema: z.email('Enter a valid email address.'),
  },
  {
    name: 'password',
    kind: 'password',
    label: 'Password',
    span: 'half',
    schema: z.string().min(8, 'Use at least 8 characters.'),
  },
  {
    name: 'weightKg',
    kind: 'number',
    label: 'Number with unit',
    unit: 'kg',
    placeholder: '72',
    hint: 'Strings in, numbers out — the real parse boundary.',
    schema: numeric('Weight', { min: 25, max: 400 }),
  },
  {
    name: 'exerciseId',
    kind: 'select',
    label: 'Select',
    placeholder: 'Pick an exercise',
    hint: 'Options come from the seeded exercise catalogue.',
    options: exerciseOptions,
    schema: z.string().min(1, 'Pick an exercise.'),
  },
  {
    name: 'goal',
    kind: 'radio-cards',
    label: 'Radio cards',
    schema: z.string().min(1, 'Choose a goal to continue.'),
    options: [
      { value: 'lose', label: 'Lose weight', description: 'A steady, sustainable deficit.' },
      {
        value: 'build',
        label: 'Build muscle',
        description: 'Progressive overload, slight surplus.',
      },
      { value: 'maintain', label: 'Maintain', description: 'Hold steady, improve composition.' },
    ],
  },
  {
    name: 'unitSystem',
    kind: 'segmented',
    label: 'Segmented',
    schema: z.enum(['metric', 'imperial'], { error: 'Choose a unit system.' }),
    options: [
      { value: 'metric', label: 'Metric (cm, kg)' },
      { value: 'imperial', label: 'Imperial (ft, lb)' },
    ],
  },
  {
    name: 'terms',
    kind: 'checkbox',
    label: 'Checkbox',
    hint: 'Drafts stay all-string: checked is the string true.',
    schema: z.string().refine((v) => v === 'true', 'Accept the demo terms to continue.'),
  },
  {
    name: 'sets',
    kind: 'repeater',
    label: 'Set',
    hint: 'The repeater: rows of half-width fields, addressed by index.',
    addLabel: 'Add set',
    itemDefaults: setDefaults,
    minRows: 1,
    maxRows: 5,
    schema: workoutFieldSchemas.sets,
    itemFields: [
      {
        name: 'reps',
        kind: 'number',
        label: 'Reps',
        placeholder: '8',
        span: 'half',
        schema: workoutFieldSchemas.reps,
      },
      {
        name: 'weightKg',
        kind: 'number',
        label: 'Weight',
        unit: 'kg',
        placeholder: '60',
        span: 'half',
        schema: workoutFieldSchemas.weightKg,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Composite card data — computed with the real engines, never hand-fudged

const DEMO_PROFILE: ProfilePayload = {
  goal: 'lose_weight',
  unitSystem: 'metric',
  heightCm: 178,
  weightKg: 84,
  targetWeightKg: 78,
  rateKgPerWeek: 0.5,
  age: 34,
  sex: 'male',
  activityLevel: 'moderate',
};

export const demoPlan: Plan = computePlan(DEMO_PROFILE);

/** 5×100 + 5×100 + 8×80 → 1640 kg, the same anchor the workout e2e trusts. */
export const demoWorkout: LoggedWorkout = {
  id: 'design-demo',
  loggedAt: '2026-08-01T09:30:00.000Z',
  exerciseId: 'barbell-back-squat',
  notes: 'Felt strong — added 2.5 kg on the top set.',
  sets: [
    { reps: 5, weightKg: 100 },
    { reps: 5, weightKg: 100 },
    { reps: 8, weightKg: 80 },
  ],
};

// ---------------------------------------------------------------------------
// Kit asymmetries, documented rather than fixed

export interface AsymmetryNote {
  id: string;
  section: 'tokens' | 'primitives' | 'fields' | 'cards';
  appliesTo: 'vue' | 'svelte' | 'both';
  note: string;
}

export const GALLERY_NOTES: readonly AsymmetryNote[] = [
  {
    id: 'button-kit',
    section: 'primitives',
    appliesTo: 'both',
    note: "Svelte's Button has only default and ghost; the other four variants and all sizes are Vue-only (shadcn-vue buttonVariants).",
  },
  {
    id: 'card-kit',
    section: 'primitives',
    appliesTo: 'both',
    note: 'There is no Svelte Card primitive — PlanCard, WorkoutSummaryCard and FormWizard hand-roll rounded-xl border bg-card.',
  },
  {
    id: 'choice-wrappers',
    section: 'primitives',
    appliesTo: 'both',
    note: 'Vue has no standalone RadioCards or Segmented — that markup lives inline in FieldRenderer. Svelte ships them as dedicated wrappers.',
  },
  {
    id: 'select-shape',
    section: 'primitives',
    appliesTo: 'both',
    note: "Vue's select is 11 reka-ui compound primitives; Svelte's is one options-driven component — with an invalid prop Vue lacks.",
  },
  {
    id: 'unused-tokens',
    section: 'tokens',
    appliesTo: 'both',
    note: 'chart-* (and sidebar-*) ship with the shadcn theme but nothing in the app uses them yet.',
  },
];

export function noteText(id: string): string {
  return GALLERY_NOTES.find((n) => n.id === id)?.note ?? '';
}
