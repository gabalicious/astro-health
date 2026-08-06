import { describe, expect, it } from 'vitest';
import { fieldErrorsFromIssues } from './errors';
import { type WorkoutDraft, workoutDefaults, workoutSchema } from './workout';

/** Mirrors `errorsOf` in the sibling specs, but keeps nested row paths. */
const errorsOf = (result: {
  error?: { issues: readonly { message: string; path: PropertyKey[] }[] };
}) => (result.error ? fieldErrorsFromIssues(result.error) : {});

const draft = (overrides: Partial<WorkoutDraft> = {}): WorkoutDraft => ({
  ...workoutDefaults,
  exerciseId: 'barbell-back-squat',
  notes: '',
  sets: [{ reps: '5', weightKg: '100' }],
  ...overrides,
});

describe('workoutSchema', () => {
  it('parses a session and turns every cell into a number', () => {
    const result = workoutSchema.parse(
      draft({
        sets: [
          { reps: '5', weightKg: '100' },
          { reps: '8', weightKg: '80.5' },
        ],
      }),
    );

    expect(result.exerciseId).toBe('barbell-back-squat');
    expect(result.sets).toEqual([
      { reps: 5, weightKg: 100 },
      { reps: 8, weightKg: 80.5 },
    ]);
  });

  it('allows a zero weight for bodyweight work', () => {
    const result = workoutSchema.safeParse(
      draft({ exerciseId: 'pull-up', sets: [{ reps: '12', weightKg: '0' }] }),
    );
    expect(result.success).toBe(true);
  });

  it('requires at least one set', () => {
    const result = workoutSchema.safeParse(draft({ sets: [] }));
    expect(result.success).toBe(false);
    expect(errorsOf(result).sets).toEqual(['Add at least one set.']);
  });

  it('rejects an exercise that is not in the catalogue', () => {
    const result = workoutSchema.safeParse(draft({ exerciseId: 'moon-press' }));
    expect(result.success).toBe(false);
    expect(errorsOf(result).exerciseId).toEqual(['Pick an exercise from the list.']);
  });

  it('blames the exact row that is wrong, not the whole array', () => {
    const result = workoutSchema.safeParse(
      draft({
        sets: [
          { reps: '5', weightKg: '100' },
          { reps: '', weightKg: '90' },
          { reps: '5', weightKg: '100' },
        ],
      }),
    );

    expect(result.success).toBe(false);
    const errors = errorsOf(result);

    // The client binds this row to `sets[1].reps`; the key has to match exactly.
    expect(errors['sets[1].reps']).toEqual(['Reps is required.']);
    expect(errors['sets[0].reps']).toBeUndefined();
    expect(errors.sets).toBeUndefined();
  });

  it('rejects fractional reps', () => {
    const result = workoutSchema.safeParse(draft({ sets: [{ reps: '5.5', weightKg: '100' }] }));
    expect(errorsOf(result)['sets[0].reps']).toEqual(['Reps must be a whole number.']);
  });
});
