import { exerciseOptions } from '@/lib/data/exercises';
import {
  setDefaults,
  type WorkoutDraft,
  workoutDefaults,
  workoutFieldSchemas,
} from '@/lib/schema/workout';
import type { WizardConfig } from './types';

/**
 * The first config with a repeated group. Sets are declared once as
 * `itemFields`; the renderer expands them per row and binds each cell to
 * `sets[i].reps` and friends.
 */
export const workoutForm: WizardConfig<WorkoutDraft> = {
  id: 'workout',
  defaults: workoutDefaults,
  steps: [
    {
      id: 'session',
      title: 'Log a workout',
      description: 'One exercise at a time. Add a row for every set you finished.',
      fields: [
        {
          name: 'exerciseId',
          kind: 'select',
          label: 'Exercise',
          placeholder: 'Pick an exercise',
          // Options come from the seeded catalogue — the data drives the form.
          options: exerciseOptions,
          schema: workoutFieldSchemas.exerciseId,
        },
        {
          name: 'sets',
          kind: 'repeater',
          label: 'Set',
          hint: 'Weight in kilograms. Leave it at 0 for bodyweight work.',
          addLabel: 'Add set',
          itemDefaults: setDefaults,
          minRows: 1,
          maxRows: 20,
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
        {
          name: 'notes',
          kind: 'text',
          label: 'Notes',
          hint: 'Optional — how it felt, what to change next time.',
          placeholder: 'Left knee felt tight on the last set',
          schema: workoutFieldSchemas.notes,
        },
      ],
    },
  ],
};
