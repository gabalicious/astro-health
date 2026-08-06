<script lang="ts">
import { Progress } from 'bits-ui';
import { cn } from '@/lib/utils';

let { value = 0, class: className }: { value?: number; class?: string } = $props();
</script>

<Progress.Root
  {value}
  max={100}
  class={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
>
  <div
    class="bg-primary h-full w-full flex-1 transition-all"
    style="transform: translateX(-{100 - value}%)"
  ></div>
</Progress.Root>
