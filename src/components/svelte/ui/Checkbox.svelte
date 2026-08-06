<script lang="ts">
import { Checkbox } from 'bits-ui';

let {
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
} = $props();
</script>

<Checkbox.Root
  {id}
  {checked}
  {onCheckedChange}
  class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
>
  {#snippet children({ checked: isChecked })}
    {#if isChecked}
      <svg
        class="size-3.5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    {/if}
  {/snippet}
</Checkbox.Root>
