import raw from '@/data/exercises.json';
import type { FieldOption } from '@/lib/forms/types';

/**
 * Seeded exercise catalogue. It stands in for the table a real backend would
 * own, and the form config derives its options from here — the data drives the
 * picker rather than the picker hard-coding the data.
 */
export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
}

export const EXERCISES: readonly Exercise[] = [...(raw as Exercise[])].sort(
  (a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name),
);

const byId = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

export function exerciseById(id: string): Exercise | undefined {
  return byId.get(id);
}

export const exerciseOptions: readonly FieldOption[] = EXERCISES.map((exercise) => ({
  value: exercise.id,
  label: exercise.name,
  description: `${exercise.muscle} · ${exercise.equipment}`,
}));
