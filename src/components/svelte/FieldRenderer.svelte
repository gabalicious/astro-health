<script lang="ts" generics="TValues extends DraftValues">
import type { FullAutoFill } from 'svelte/elements';
import Checkbox from '@/components/svelte/ui/Checkbox.svelte';
import Input from '@/components/svelte/ui/Input.svelte';
import Label from '@/components/svelte/ui/Label.svelte';
import RadioCards from '@/components/svelte/ui/RadioCards.svelte';
import Segmented from '@/components/svelte/ui/Segmented.svelte';
import Select from '@/components/svelte/ui/Select.svelte';
import { type DraftValues, errorMessages, type ScalarFieldConfig } from '@/lib/forms/types';

// TanStack's field API is keyed to literal field names; a config-driven
// renderer can only hold it loosely typed.
// biome-ignore lint/suspicious/noExplicitAny: see above
type AnyFieldApi = any;

let {
  field,
  name,
  form,
  stepAttempted,
  serverErrors,
  onClearServerError,
}: {
  field: ScalarFieldConfig<TValues>;
  /** Overrides the bound path, e.g. `sets[0].reps` inside a repeater. */
  name?: string;
  // TanStack's generics are keyed to literal field names, so a renderer driven
  // by config can only hold the form loosely typed.
  // biome-ignore lint/suspicious/noExplicitAny: see above
  form: any;
  stepAttempted: boolean;
  serverErrors?: string[];
  onClearServerError: (name: string) => void;
} = $props();

// Rows share a config but must not share DOM ids: inside a repeater this is
// `sets[0].reps`, not `reps`.
const fieldId = $derived(name ?? field.name);

const inputType = $derived(field.kind === 'number' ? 'text' : field.kind);

function visibleErrors(fieldErrors: readonly unknown[], isBlurred: boolean): string[] {
  if (serverErrors?.length) return serverErrors;
  if (!isBlurred && !stepAttempted) return [];
  return errorMessages(fieldErrors);
}

function change(handleChange: (value: string) => void, value: string) {
  handleChange(value);
  if (serverErrors?.length) onClearServerError(name ?? field.name);
}
</script>

<form.Field
  name={name ?? field.name}
  validators={{ onChange: field.schema }}
>
  {#snippet children(f: AnyFieldApi)}
    {@const errors = visibleErrors(f.state.meta.errors, f.state.meta.isBlurred)}
    <div class="grid gap-2">
      <!-- Checkboxes label to the right; every other kind labels above. -->
      {#if field.kind !== 'checkbox'}
        <div class="grid gap-1">
          <Label for={fieldId}>{field.label}</Label>
          {#if field.hint}
            <p class="text-sm text-muted-foreground">{field.hint}</p>
          {/if}
        </div>
      {/if}

      {#if field.kind === 'checkbox'}
        <div class="flex items-start gap-3">
          <Checkbox
            id={fieldId}
            checked={f.state.value === 'true'}
            onCheckedChange={(checked) => change(f.handleChange, checked ? 'true' : '')}
          />
          <div class="grid gap-1">
            <Label for={fieldId}>{field.label}</Label>
            {#if field.hint}
              <p class="text-sm text-muted-foreground">{field.hint}</p>
            {/if}
          </div>
        </div>
      {:else if field.kind === 'segmented'}
        <Segmented
          name={fieldId}
          value={f.state.value}
          options={field.options ?? []}
          onValueChange={(value) => change(f.handleChange, value)}
        />
      {:else if field.kind === 'radio-cards'}
        <RadioCards
          name={fieldId}
          value={f.state.value}
          options={field.options ?? []}
          onValueChange={(value) => change(f.handleChange, value)}
        />
      {:else if field.kind === 'select'}
        <Select
          id={fieldId}
          value={f.state.value}
          options={field.options ?? []}
          placeholder={field.placeholder}
          invalid={errors.length > 0}
          onValueChange={(value) => change(f.handleChange, value)}
        />
      {:else}
        <div class="relative">
          <Input
            id={fieldId}
            type={inputType}
            inputmode={field.kind === 'number' ? 'decimal' : undefined}
            placeholder={field.placeholder}
            autocomplete={field.autocomplete as FullAutoFill | undefined}
            value={f.state.value}
            aria-invalid={errors.length > 0}
            class={field.unit ? 'pr-12' : undefined}
            onblur={f.handleBlur}
            oninput={(event) => change(f.handleChange, event.currentTarget.value)}
          />
          {#if field.unit}
            <span
              class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
            >
              {field.unit}
            </span>
          {/if}
        </div>
      {/if}

      {#each errors as message (message)}
        <p class="text-sm text-destructive">{message}</p>
      {/each}
    </div>
  {/snippet}
</form.Field>
