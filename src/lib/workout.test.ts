import { describe, expect, it } from 'vitest';
import type { WorkoutPayload } from '@/lib/schema/workout';
import { summariseWorkout } from './workout';

const workout = (sets: { reps: number; weightKg: number }[]): WorkoutPayload => ({
  exerciseId: 'barbell-back-squat',
  notes: '',
  sets,
});

describe('summariseWorkout', () => {
  it('sums volume as reps times weight across every set', () => {
    // 5×100 + 5×100 + 8×80 = 500 + 500 + 640 = 1640
    const summary = summariseWorkout(
      workout([
        { reps: 5, weightKg: 100 },
        { reps: 5, weightKg: 100 },
        { reps: 8, weightKg: 80 },
      ]),
    );

    expect(summary).toEqual({ setCount: 3, totalReps: 18, volumeKg: 1640, topSetKg: 100 });
  });

  it('reports the heaviest set rather than the last one', () => {
    const summary = summariseWorkout(
      workout([
        { reps: 3, weightKg: 120 },
        { reps: 10, weightKg: 60 },
      ]),
    );

    expect(summary.topSetKg).toBe(120);
    expect(summary.volumeKg).toBe(960); // 360 + 600
  });

  it('rounds volume to one decimal', () => {
    // 3 × 62.55 is 187.64999999999998 in IEEE754, not 187.65, so this rounds
    // down. Recomputed rather than forced — the arithmetic is what it is.
    const summary = summariseWorkout(workout([{ reps: 3, weightKg: 62.55 }]));
    expect(summary.volumeKg).toBe(187.6);
  });

  it('handles bodyweight work without dividing by anything', () => {
    const summary = summariseWorkout(workout([{ reps: 12, weightKg: 0 }]));
    expect(summary).toEqual({ setCount: 1, totalReps: 12, volumeKg: 0, topSetKg: 0 });
  });
});
