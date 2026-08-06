<script lang="ts">
import FormWizard from '@/components/svelte/FormWizard.svelte';
import WorkoutSummaryCard from '@/components/svelte/WorkoutSummaryCard.svelte';
import { fetchWorkouts, submitWorkout } from '@/lib/api';
import { exerciseById } from '@/lib/data/exercises';
import { workoutForm } from '@/lib/forms/workout-form';
import { summariseWorkout } from '@/lib/workout';
import type { LoggedWorkout } from '@/server/store';

let { loginHref, workoutsHref }: { loginHref: string; workoutsHref: string } = $props();

let recent = $state<LoggedWorkout[]>([]);
let listState = $state<'loading' | 'ready' | 'error'>('loading');

$effect(() => {
  fetchWorkouts().then((result) => {
    if (result.status === 'unauthenticated') {
      window.location.href = loginHref;
      return;
    }
    if (result.status === 'error') {
      listState = 'error';
      return;
    }

    recent = result.workouts;
    listState = 'ready';
  });
});

const nameOf = (workout: LoggedWorkout) =>
  exerciseById(workout.exerciseId)?.name ?? workout.exerciseId;
</script>

<div class="grid w-full max-w-xl gap-8">
  <FormWizard
    config={workoutForm}
    submit={submitWorkout}
    submitLabel="Save workout"
    submittingLabel="Saving…"
    successTitle="Workout logged"
    successDescription="Added to your training log."
  >
    {#snippet success({ result })}
      <div class="grid w-full max-w-xl gap-4">
        {#if result.workout}
          <WorkoutSummaryCard workout={result.workout} />
        {/if}
        <a href={workoutsHref} class="text-sm text-primary hover:underline">Log another</a>
      </div>
    {/snippet}
  </FormWizard>

  {#if listState === 'ready' && recent.length > 0}
    <section class="grid gap-3">
      <h2 class="text-sm font-medium">Recent sessions</h2>
      <ul class="grid gap-2">
        {#each recent as workout (workout.id)}
          {@const summary = summariseWorkout(workout)}
          <li
            class="flex items-center justify-between rounded-lg border border-input px-4 py-3 text-sm"
          >
            <span class="font-medium">{nameOf(workout)}</span>
            <span class="text-muted-foreground">
              {summary.setCount} sets · {summary.volumeKg} kg
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
