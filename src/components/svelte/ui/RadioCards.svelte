<script lang="ts">
import { RadioGroup } from 'bits-ui';
import type { FieldOption } from '@/lib/forms/types';

let {
  name,
  value,
  options,
  onValueChange,
}: {
  name: string;
  value: string;
  options: readonly FieldOption[];
  onValueChange: (value: string) => void;
} = $props();
</script>

<RadioGroup.Root {value} {onValueChange} class="grid gap-2">
  {#each options as option (option.value)}
    <RadioGroup.Item
      id={`${name}-${option.value}`}
      value={option.value}
      class="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-4 text-left outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
    >
      {#snippet children({ checked })}
        <span
          class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input"
        >
          {#if checked}
            <span class="size-2 rounded-full bg-primary"></span>
          {/if}
        </span>
        <span class="grid gap-1">
          <span class="text-sm font-medium leading-none">{option.label}</span>
          {#if option.description}
            <span class="text-sm text-muted-foreground">{option.description}</span>
          {/if}
        </span>
      {/snippet}
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
