<script lang="ts">
import { exerciseById } from '@/lib/data/exercises';
import { summariseWorkout } from '@/lib/workout';
import type { LoggedWorkout } from '@/server/store';

let { workout }: { workout: LoggedWorkout } = $props();

const summary = $derived(summariseWorkout(workout));
const exerciseName = $derived(exerciseById(workout.exerciseId)?.name ?? 'Workout');
</script>

<div class="w-full max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
  <div class="grid gap-1.5 px-6 pt-6">
    <h2 class="text-lg font-semibold leading-none">{exerciseName} logged</h2>
    <p class="text-sm text-muted-foreground">Nice work — here is what you just put in the bank.</p>
  </div>
  <div class="grid grid-cols-2 gap-4 px-6 py-6">
    <div class="grid gap-1">
      <span class="text-sm text-muted-foreground">Sets</span>
      <span class="text-2xl font-semibold" data-testid="workout-sets">{summary.setCount}</span>
    </div>
    <div class="grid gap-1">
      <span class="text-sm text-muted-foreground">Total reps</span>
      <span class="text-2xl font-semibold">{summary.totalReps}</span>
    </div>
    <div class="grid gap-1">
      <span class="text-sm text-muted-foreground">Volume</span>
      <span class="text-2xl font-semibold" data-testid="workout-volume">{summary.volumeKg} kg</span>
    </div>
    <div class="grid gap-1">
      <span class="text-sm text-muted-foreground">Top set</span>
      <span class="text-2xl font-semibold">{summary.topSetKg} kg</span>
    </div>
    {#if workout.notes}
      <p class="col-span-2 text-sm text-muted-foreground">“{workout.notes}”</p>
    {/if}
  </div>
</div>
