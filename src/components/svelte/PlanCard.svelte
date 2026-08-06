<script lang="ts">
import { type Plan, targetDateLabel } from '@/lib/plan';

let { plan }: { plan?: Plan } = $props();

const macroLabels = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'fatG', label: 'Fat' },
  { key: 'carbsG', label: 'Carbs' },
] as const;
</script>

<div class="w-full max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
  <div class="grid gap-1.5 px-6 pt-6">
    <h2 class="text-lg font-semibold leading-none">You're all set</h2>
    <p class="text-sm text-muted-foreground">Here is your daily plan — tuned to your answers.</p>
  </div>

  {#if plan}
    <div class="grid gap-6 px-6 py-6">
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-semibold tracking-tight" data-testid="plan-calories">
          {plan.calories.toLocaleString('en-US')}
        </span>
        <span class="text-muted-foreground">kcal / day</span>
      </div>

      <div class="grid grid-cols-3 gap-4">
        {#each macroLabels as macro (macro.key)}
          <div class="grid gap-1 rounded-lg border p-3">
            <span class="text-sm text-muted-foreground">{macro.label}</span>
            <span class="text-lg font-medium">{plan.macros[macro.key]} g</span>
          </div>
        {/each}
      </div>

      {#if plan.goal === 'lose_weight' && plan.weeksToTarget !== undefined}
        <p class="text-sm text-muted-foreground">
          About <span class="font-medium text-foreground">{plan.weeksToTarget} weeks</span> to
          {plan.targetWeightKg} kg — around
          <span class="font-medium text-foreground">{targetDateLabel(plan.weeksToTarget)}</span>.
        </p>
      {/if}

      {#if plan.flooredToMinimum}
        <p
          class="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
        >
          We capped your deficit at a safe minimum of {plan.calories.toLocaleString('en-US')} kcal,
          so progress will be a little slower than the rate you picked.
        </p>
      {/if}

      <p class="text-sm text-muted-foreground">
        Maintenance is about {plan.tdee.toLocaleString('en-US')} kcal at your activity level (basal
        rate {plan.bmr.toLocaleString('en-US')} kcal).
      </p>
    </div>
  {:else}
    <div class="px-6 pb-6"></div>
  {/if}
</div>
