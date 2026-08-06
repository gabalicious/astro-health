import { round1 } from '@/lib/schema/numeric';
import type { WorkoutPayload } from '@/lib/schema/workout';

/**
 * Pure session math, like `plan.ts`: no dates, no IO. The server computes it on
 * save and each framework's summary card just renders it.
 */

export interface WorkoutSummary {
  setCount: number;
  totalReps: number;
  /** Tonnage: the sum of reps × weight across every set. */
  volumeKg: number;
  /** Heaviest single set, which is what people actually brag about. */
  topSetKg: number;
}

export function summariseWorkout(workout: WorkoutPayload): WorkoutSummary {
  const setCount = workout.sets.length;
  const totalReps = workout.sets.reduce((total, set) => total + set.reps, 0);
  const volumeKg = workout.sets.reduce((total, set) => total + set.reps * set.weightKg, 0);
  const topSetKg = workout.sets.reduce((heaviest, set) => Math.max(heaviest, set.weightKg), 0);

  return { setCount, totalReps, volumeKg: round1(volumeKg), topSetKg: round1(topSetKg) };
}
