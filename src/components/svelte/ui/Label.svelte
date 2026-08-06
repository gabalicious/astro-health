<script lang="ts">
import { Label } from 'bits-ui';
import type { Snippet } from 'svelte';
import { cn } from '@/lib/utils';

let {
  for: htmlFor,
  class: className,
  children,
}: { for?: string; class?: string; children: Snippet } = $props();
</script>

<Label.Root
  for={htmlFor}
  class={cn(
    'flex items-center gap-2 text-sm leading-none font-medium select-none',
    className,
  )}
>
  {@render children()}
</Label.Root>
