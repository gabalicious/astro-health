<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FormWizard from '@/components/vue/FormWizard.vue';
import WorkoutSummaryCard from '@/components/vue/WorkoutSummaryCard.vue';
import { fetchWorkouts, submitWorkout } from '@/lib/api';
import { exerciseById } from '@/lib/data/exercises';
import { workoutForm } from '@/lib/forms/workout-form';
import { summariseWorkout } from '@/lib/workout';
import type { LoggedWorkout } from '@/server/store';

const props = defineProps<{ loginHref: string; workoutsHref: string }>();

const recent = ref<LoggedWorkout[]>([]);
const listState = ref<'loading' | 'ready' | 'error'>('loading');

onMounted(async () => {
  const result = await fetchWorkouts();

  if (result.status === 'unauthenticated') {
    window.location.href = props.loginHref;
    return;
  }
  if (result.status === 'error') {
    listState.value = 'error';
    return;
  }

  recent.value = result.workouts;
  listState.value = 'ready';
});

const nameOf = (workout: LoggedWorkout) =>
  exerciseById(workout.exerciseId)?.name ?? workout.exerciseId;
const volumeOf = (workout: LoggedWorkout) => summariseWorkout(workout);
</script>

<template>
  <div class="grid w-full max-w-xl gap-8">
    <FormWizard
      :config="workoutForm"
      :submit="submitWorkout"
      submit-label="Save workout"
      submitting-label="Saving…"
      success-title="Workout logged"
      success-description="Added to your training log."
    >
      <template #success="{ result }">
        <div class="grid w-full max-w-xl gap-4">
          <WorkoutSummaryCard v-if="result.workout" :workout="result.workout" />
          <a :href="workoutsHref" class="text-sm text-primary hover:underline">Log another</a>
        </div>
      </template>
    </FormWizard>

    <section v-if="listState === 'ready' && recent.length > 0" class="grid gap-3">
      <h2 class="text-sm font-medium">Recent sessions</h2>
      <ul class="grid gap-2">
        <li
          v-for="workout in recent"
          :key="workout.id"
          class="flex items-center justify-between rounded-lg border border-input px-4 py-3 text-sm"
        >
          <span class="font-medium">{{ nameOf(workout) }}</span>
          <span class="text-muted-foreground">
            {{ volumeOf(workout).setCount }} sets · {{ volumeOf(workout).volumeKg }} kg
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
