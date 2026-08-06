<script lang="ts" generics="TValues extends DraftValues">
import FieldRenderer from '@/components/svelte/FieldRenderer.svelte';
import Button from '@/components/svelte/ui/Button.svelte';
import type { FieldErrors } from '@/lib/api';
import {
  type DraftRow,
  type DraftValues,
  groupErrorMessages,
  type RepeaterFieldConfig,
  rowFieldName,
} from '@/lib/forms/types';

// TanStack keys its generics to literal field names; a config-driven renderer
// can only hold the API loosely typed.
// biome-ignore lint/suspicious/noExplicitAny: see above
type AnyFieldApi = any;

let {
  field,
  form,
  stepAttempted,
  serverErrors,
  onClearServerError,
}: {
  field: RepeaterFieldConfig<TValues>;
  // biome-ignore lint/suspicious/noExplicitAny: see above
  form: any;
  stepAttempted: boolean;
  /** The whole map — rows look themselves up by `sets[0].reps`. */
  serverErrors: FieldErrors;
  onClearServerError: (name: string) => void;
} = $props();

const minRows = field.minRows ?? 0;
const maxRows = field.maxRows ?? Number.POSITIVE_INFINITY;

const rowsOf = (value: unknown): DraftRow[] => (Array.isArray(value) ? value : []);

const labelFor = (index: number) => field.rowLabel?.(index) ?? `${field.label} ${index + 1}`;

/** Array-level rules ("at least one set") only once the user has tried to submit. */
function arrayErrors(fieldErrors: readonly unknown[]): string[] {
  const server = serverErrors[field.name] ?? [];
  if (server.length > 0) return server;
  return stepAttempted ? groupErrorMessages(fieldErrors) : [];
}
</script>

<form.Field name={field.name} mode="array" validators={{ onChange: field.schema }}>
  {#snippet children(f: AnyFieldApi)}
    <div class="grid gap-3">
      <div class="grid gap-1">
        <span class="text-sm font-medium">{field.label}</span>
        {#if field.hint}
          <p class="text-sm text-muted-foreground">{field.hint}</p>
        {/if}
      </div>

      <!-- Keyed by index on purpose: TanStack's paths are index-based, so DOM
           identity has to follow position or a removal would leave a row bound
           to its old neighbour's name. -->
      {#each rowsOf(f.state.value) as _row, index (index)}
        <div class="grid gap-4 rounded-lg border border-input p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">{labelFor(index)}</span>
            <button
              type="button"
              class="text-sm text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
              disabled={rowsOf(f.state.value).length <= minRows}
              onclick={() => f.removeValue(index)}
            >
              Remove
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            {#each field.itemFields as item (item.name)}
              <div class={item.span === 'half' ? 'col-span-1' : 'col-span-2'}>
                <FieldRenderer
                  field={item}
                  name={rowFieldName(field.name, index, item.name)}
                  {form}
                  {stepAttempted}
                  serverErrors={serverErrors[rowFieldName(field.name, index, item.name)]}
                  {onClearServerError}
                />
              </div>
            {/each}
          </div>
        </div>
      {/each}

      {#each arrayErrors(f.state.meta.errors) as message (message)}
        <p class="text-sm text-destructive">{message}</p>
      {/each}

      <Button
        variant="ghost"
        class="justify-self-start"
        disabled={rowsOf(f.state.value).length >= maxRows}
        onclick={() => f.pushValue({ ...field.itemDefaults })}
      >
        {field.addLabel}
      </Button>
    </div>
  {/snippet}
</form.Field>
