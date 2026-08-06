import { z } from 'zod';
import { exerciseById } from '@/lib/data/exercises';
import { numeric } from './numeric';

/**
 * A logged training session: one exercise, one or more sets.
 *
 * This is the first schema with a repeated group, so it is also the first place
 * errors are nested — see `fieldErrorsFromIssues` for how `sets[1].reps` gets
 * back to the right input.
 */

const setSchema = z.object({
  reps: numeric('Reps', { min: 1, max: 1000, int: true }),
  // 0 is legitimate: bodyweight work still has reps worth recording.
  weightKg: numeric('Weight', { min: 0, max: 500 }),
});

export const workoutFieldSchemas = {
  exerciseId: z
    .string()
    .min(1, 'Pick an exercise.')
    // The valid set is data, not types — this also rejects a tampered id.
    .refine((id) => Boolean(exerciseById(id)), 'Pick an exercise from the list.'),
  sets: z
    .array(setSchema)
    .min(1, 'Add at least one set.')
    .max(20, 'That is a lot of sets — split it into two entries.'),
  reps: setSchema.shape.reps,
  weightKg: setSchema.shape.weightKg,
  notes: z.string().max(500, 'Keep notes under 500 characters.'),
} as const;

export const workoutSchema = z.object({
  exerciseId: workoutFieldSchemas.exerciseId,
  sets: workoutFieldSchemas.sets,
  notes: workoutFieldSchemas.notes,
});

/** Parsed, server-side shape: reps and weights are numbers. */
export type WorkoutPayload = z.output<typeof workoutSchema>;

/** One row of the repeater. All-string, like every other draft. */
export type SetDraft = {
  reps: string;
  weightKg: string;
};

export type WorkoutDraft = {
  exerciseId: string;
  notes: string;
  sets: SetDraft[];
};

export const setDefaults: SetDraft = { reps: '', weightKg: '' };

export const workoutDefaults: WorkoutDraft = {
  exerciseId: '',
  notes: '',
  // One empty row so the form opens ready to type into.
  sets: [{ ...setDefaults }],
};
