<script setup lang="ts">
import { computed } from 'vue';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/vue/ui/card';
import { exerciseById } from '@/lib/data/exercises';
import { summariseWorkout } from '@/lib/workout';
import type { LoggedWorkout } from '@/server/store';

const props = defineProps<{ workout: LoggedWorkout }>();

const summary = computed(() => summariseWorkout(props.workout));
const exerciseName = computed(() => exerciseById(props.workout.exerciseId)?.name ?? 'Workout');
</script>

<template>
  <Card class="w-full max-w-xl">
    <CardHeader>
      <CardTitle>{{ exerciseName }} logged</CardTitle>
      <CardDescription>Nice work — here is what you just put in the bank.</CardDescription>
    </CardHeader>
    <CardContent class="grid grid-cols-2 gap-4">
      <div class="grid gap-1">
        <span class="text-sm text-muted-foreground">Sets</span>
        <span class="text-2xl font-semibold" data-testid="workout-sets">
          {{ summary.setCount }}
        </span>
      </div>
      <div class="grid gap-1">
        <span class="text-sm text-muted-foreground">Total reps</span>
        <span class="text-2xl font-semibold">{{ summary.totalReps }}</span>
      </div>
      <div class="grid gap-1">
        <span class="text-sm text-muted-foreground">Volume</span>
        <span class="text-2xl font-semibold" data-testid="workout-volume">
          {{ summary.volumeKg }} kg
        </span>
      </div>
      <div class="grid gap-1">
        <span class="text-sm text-muted-foreground">Top set</span>
        <span class="text-2xl font-semibold">{{ summary.topSetKg }} kg</span>
      </div>
      <p v-if="workout.notes" class="col-span-2 text-sm text-muted-foreground">
        “{{ workout.notes }}”
      </p>
    </CardContent>
  </Card>
</template>
