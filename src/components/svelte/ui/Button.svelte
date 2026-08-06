<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'ghost';

let {
  variant = 'default',
  class: className,
  children,
  ...rest
}: HTMLButtonAttributes & { variant?: Variant; class?: string; children: Snippet } = $props();

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};
</script>

<button
  type="button"
  class={cn(
    'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    className,
  )}
  {...rest}
>
  {@render children()}
</button>
