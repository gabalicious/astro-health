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

<RadioGroup.Root
  {value}
  {onValueChange}
  orientation="horizontal"
  class="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-muted p-1"
>
  {#each options as option (option.value)}
    <RadioGroup.Item
      id={`${name}-${option.value}`}
      value={option.value}
      class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm"
    >
      {#snippet children()}
        {option.label}
      {/snippet}
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
