<script lang="ts">
import { Select } from 'bits-ui';
import type { FieldOption } from '@/lib/forms/types';

let {
  id,
  value,
  options,
  placeholder = 'Select an option',
  invalid = false,
  onValueChange,
}: {
  id: string;
  value: string;
  options: readonly FieldOption[];
  placeholder?: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
} = $props();

const selectedLabel = $derived(options.find((option) => option.value === value)?.label);
</script>

<Select.Root type="single" {value} {onValueChange}>
  <Select.Trigger
    {id}
    aria-invalid={invalid}
    class="border-input dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
  >
    <span class={selectedLabel ? '' : 'text-muted-foreground'}>
      {selectedLabel ?? placeholder}
    </span>
    <svg
      class="size-4 shrink-0 opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      sideOffset={4}
      class="bg-popover text-popover-foreground z-50 max-h-96 min-w-[var(--bits-select-anchor-width)] overflow-y-auto rounded-md border p-1 shadow-md"
    >
      <Select.Viewport>
        {#each options as option (option.value)}
          <Select.Item
            value={option.value}
            label={option.label}
            class="data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex w-full cursor-default items-center justify-between rounded-sm py-1.5 pr-2 pl-2 text-sm outline-hidden select-none"
          >
            {#snippet children({ selected })}
              {option.label}
              {#if selected}
                <svg
                  class="size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              {/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
