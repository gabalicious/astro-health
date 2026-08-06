<script lang="ts" generics="TValues extends DraftValues">
import { createForm } from '@tanstack/svelte-form';
import type { Snippet } from 'svelte';
import FieldRenderer from '@/components/svelte/FieldRenderer.svelte';
import RepeaterField from '@/components/svelte/RepeaterField.svelte';
import Button from '@/components/svelte/ui/Button.svelte';
import Progress from '@/components/svelte/ui/Progress.svelte';
import type { ApiResult, FieldErrors } from '@/lib/api';
import {
  cloneDraft,
  type DraftValues,
  stepIndexOfField,
  validationNames,
  visibleFields,
  type WizardConfig,
} from '@/lib/forms/types';

type OkResult = Extract<ApiResult, { ok: true }>;

let {
  config,
  submit,
  mode = 'wizard',
  initialValues,
  submitLabel,
  submittingLabel,
  successTitle,
  successDescription,
  onSuccess,
  success,
}: {
  config: WizardConfig<TValues>;
  submit: (values: TValues) => Promise<ApiResult>;
  /** 'wizard' (default): one step at a time. 'single': all steps as sections, one Save. */
  mode?: 'wizard' | 'single';
  /** Seeds the form (e.g. settings prefill). Read once — gate rendering until known. */
  initialValues?: TValues;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successDescription: string;
  /** Lets the caller navigate on success instead of resting on the done card. */
  onSuccess?: (result: OkResult) => void;
  /** Replaces the whole success card; omit it to keep the static one. */
  success?: Snippet<[{ result: OkResult }]>;
} = $props();

const steps = config.steps;
// Cloned: a repeater's default rows are an array, and sharing that reference
// across form instances would let one form mutate another's defaults.
const defaults = cloneDraft(initialValues ?? config.defaults);

const form = createForm(() => ({ defaultValues: defaults }));
const selector = form.useSelector((state) => state.values);
const defaultSelector = form.useSelector((state) => state.isDefaultValue);

let stepIndex = $state(0);
let stepAttempted = $state(false);
let status = $state<'idle' | 'submitting' | 'done'>('idle');
let serverErrors = $state<FieldErrors>({});
let serverMessage = $state<string | null>(null);
let successResult = $state<OkResult | null>(null);

const values = $derived(selector.current as TValues);
const step = $derived(steps[stepIndex]);
const activeSteps = $derived(mode === 'single' ? steps : [step]);
const fieldsToValidate = $derived(activeSteps.flatMap((s) => visibleFields(s, values)));
const isLastStep = $derived(mode === 'single' || stepIndex === steps.length - 1);
const progress = $derived(((stepIndex + 1) / steps.length) * 100);
// A one-step form is just a form; the step chrome would be noise.
const showStepChrome = $derived(mode === 'wizard' && steps.length > 1);
// In single mode, Save means "apply my edits" — nothing changed, nothing to save.
const submitDisabled = $derived(
  status === 'submitting' || (mode === 'single' && defaultSelector.current),
);

// A field the user can no longer see should not keep contributing an answer.
$effect(() => {
  for (const s of steps) {
    for (const field of s.fields) {
      if (!field.showIf || field.showIf(values)) continue;
      const fallback = defaults[field.name];
      if (values[field.name] !== fallback) {
        form.setFieldValue(field.name as never, fallback as never);
      }
    }
  }
});

function goToStep(index: number, attempted = false) {
  stepIndex = index;
  stepAttempted = attempted;
}

async function validateStep(): Promise<boolean> {
  // Use this run's results rather than the field's aggregated meta, which can
  // still hold errors recorded under a validation cause that has not re-run.
  const results = await Promise.all(
    validationNames(fieldsToValidate, values).map((name) => form.validateField(name, 'submit')),
  );
  return results.every((errors: unknown[]) => errors.length === 0);
}

async function next() {
  stepAttempted = true;
  if (!(await validateStep())) return;

  if (isLastStep) await send();
  else goToStep(stepIndex + 1);
}

async function send() {
  status = 'submitting';
  serverErrors = {};
  serverMessage = null;

  const result = await submit({ ...values });

  if (result.ok) {
    successResult = result;
    status = 'done';
    onSuccess?.(result);
    return;
  }

  status = 'idle';
  serverErrors = result.fieldErrors;
  serverMessage = result.message;

  // Send the user back to the earliest step the server took issue with. In
  // single mode every field is already on screen, so errors render in place.
  if (mode === 'wizard') {
    const earliest = Object.keys(result.fieldErrors)
      .map((name) => stepIndexOfField(config, name))
      .filter((index): index is number => index !== undefined)
      .sort((a, b) => a - b)[0];

    if (earliest !== undefined) goToStep(earliest, true);
  }
}

function clearServerError(name: string) {
  const { [name]: _removed, ...rest } = serverErrors;
  serverErrors = rest;
  if (Object.keys(rest).length === 0) serverMessage = null;
}
</script>

{#if status === 'done' && successResult}
  {#if success}
    {@render success({ result: successResult })}
  {:else}
    <div class="w-full max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
      <div class="grid gap-1.5 px-6 py-6">
        <h2 class="text-lg font-semibold leading-none">{successTitle}</h2>
        <p class="text-sm text-muted-foreground">{successDescription}</p>
      </div>
    </div>
  {/if}
{:else}
  <div class="w-full max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
    {#if mode === 'wizard'}
      <div class="grid gap-3 px-6 pt-6">
        {#if showStepChrome}
          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {stepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        {/if}
        <div class={showStepChrome ? 'mt-4 grid gap-1.5' : 'grid gap-1.5'}>
          <h2 class="text-lg font-semibold leading-none">{step.title}</h2>
          {#if step.description}
            <p class="text-sm text-muted-foreground">{step.description}</p>
          {/if}
        </div>
      </div>
    {/if}

    <div class="px-6 py-6">
      <form
        class="grid gap-8"
        novalidate
        onsubmit={(event) => {
          event.preventDefault();
          next();
        }}
      >
        {#if serverMessage}
          <p
            class="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {serverMessage}
          </p>
        {/if}

        {#each activeSteps as s (s.id)}
          <section class="grid gap-4">
            {#if mode === 'single'}
              <div class="grid gap-1">
                <h3 class="text-base font-semibold leading-none">{s.title}</h3>
                {#if s.description}
                  <p class="text-sm text-muted-foreground">{s.description}</p>
                {/if}
              </div>
            {/if}

            <div class="grid grid-cols-2 gap-6">
              {#each visibleFields(s, values) as field (field.name)}
                <div class={field.span === 'half' ? 'col-span-1' : 'col-span-2'}>
                  {#if field.kind === 'repeater'}
                    <RepeaterField
                      {field}
                      {form}
                      {stepAttempted}
                      {serverErrors}
                      onClearServerError={clearServerError}
                    />
                  {:else}
                    <FieldRenderer
                      {field}
                      {form}
                      {stepAttempted}
                      serverErrors={serverErrors[field.name]}
                      onClearServerError={clearServerError}
                    />
                  {/if}
                </div>
              {/each}
            </div>
          </section>
        {/each}

        <!-- Keeps Enter-to-submit working without a second visible button. -->
        <button type="submit" class="hidden" tabindex="-1" aria-hidden="true"></button>
      </form>
    </div>

    <div class="flex items-center justify-between px-6 pb-6">
      {#if showStepChrome}
        <Button variant="ghost" disabled={stepIndex === 0} onclick={() => goToStep(stepIndex - 1)}>
          Back
        </Button>
      {:else}
        <span></span>
      {/if}
      <Button disabled={submitDisabled} onclick={next}>
        {status === 'submitting' ? submittingLabel : isLastStep ? submitLabel : 'Continue'}
      </Button>
    </div>
  </div>
{/if}
