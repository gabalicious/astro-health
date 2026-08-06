<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/vue/ui/card';
import { type Plan, targetDateLabel } from '@/lib/plan';

defineProps<{ plan?: Plan }>();

const macroLabels = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'fatG', label: 'Fat' },
  { key: 'carbsG', label: 'Carbs' },
] as const;
</script>

<template>
  <Card class="w-full max-w-xl">
    <CardHeader>
      <CardTitle>You're all set</CardTitle>
      <CardDescription>Here is your daily plan — tuned to your answers.</CardDescription>
    </CardHeader>

    <CardContent v-if="plan" class="grid gap-6">
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-semibold tracking-tight" data-testid="plan-calories">
          {{ plan.calories.toLocaleString('en-US') }}
        </span>
        <span class="text-muted-foreground">kcal / day</span>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="macro in macroLabels"
          :key="macro.key"
          class="grid gap-1 rounded-lg border p-3"
        >
          <span class="text-sm text-muted-foreground">{{ macro.label }}</span>
          <span class="text-lg font-medium">{{ plan.macros[macro.key] }} g</span>
        </div>
      </div>

      <p
        v-if="plan.goal === 'lose_weight' && plan.weeksToTarget !== undefined"
        class="text-sm text-muted-foreground"
      >
        About <span class="font-medium text-foreground">{{ plan.weeksToTarget }} weeks</span> to
        {{ plan.targetWeightKg }} kg — around
        <span class="font-medium text-foreground">{{ targetDateLabel(plan.weeksToTarget) }}</span
        >.
      </p>

      <p
        v-if="plan.flooredToMinimum"
        class="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
      >
        We capped your deficit at a safe minimum of {{ plan.calories.toLocaleString('en-US') }}
        kcal, so progress will be a little slower than the rate you picked.
      </p>

      <p class="text-sm text-muted-foreground">
        Maintenance is about {{ plan.tdee.toLocaleString('en-US') }} kcal at your activity level
        (basal rate {{ plan.bmr.toLocaleString('en-US') }} kcal).
      </p>
    </CardContent>
  </Card>
</template>
