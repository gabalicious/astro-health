<script lang="ts">
import { createForm } from '@tanstack/svelte-form';
import FieldRenderer from '@/components/svelte/FieldRenderer.svelte';
import PlanCard from '@/components/svelte/PlanCard.svelte';
import RepeaterField from '@/components/svelte/RepeaterField.svelte';
import Button from '@/components/svelte/ui/Button.svelte';
import Checkbox from '@/components/svelte/ui/Checkbox.svelte';
import Input from '@/components/svelte/ui/Input.svelte';
import Label from '@/components/svelte/ui/Label.svelte';
import Progress from '@/components/svelte/ui/Progress.svelte';
import RadioCards from '@/components/svelte/ui/RadioCards.svelte';
import Segmented from '@/components/svelte/ui/Segmented.svelte';
import Select from '@/components/svelte/ui/Select.svelte';
import WorkoutSummaryCard from '@/components/svelte/WorkoutSummaryCard.svelte';
import {
  demoPlan,
  demoWorkout,
  GALLERY_FIELDS,
  galleryDefaults,
  noteText,
  SVELTE_BUTTON_VARIANTS,
  TOKEN_GROUPS,
} from '@/lib/design-gallery';
import { cloneDraft, validationNames } from '@/lib/forms/types';

let isDark = $state(false);
let stepAttempted = $state(false);
let demoChecked = $state(false);
let demoSelect = $state('');
let demoGoal = $state('');
let demoUnits = $state('metric');

const form = createForm(() => ({ defaultValues: cloneDraft(galleryDefaults) }));
const selector = form.useSelector((s) => s.values);

const noop = () => {};

async function toggleValidation() {
  if (stepAttempted) {
    stepAttempted = false;
    return;
  }

  stepAttempted = true;
  // Untouched fields have no errors until a validator runs — same gate as
  // FormWizard's submit, otherwise this toggle appears to do nothing.
  await Promise.all(
    validationNames(GALLERY_FIELDS, selector.current).map((name) =>
      form.validateField(name as never, 'submit'),
    ),
  );
}

const RADII = [
  { label: 'sm', class: 'rounded-sm' },
  { label: 'md', class: 'rounded-md' },
  { label: 'lg', class: 'rounded-lg' },
  { label: 'xl', class: 'rounded-xl' },
];

const DEMO_OPTIONS = [
  { value: 'one', label: 'Option one' },
  { value: 'two', label: 'Option two' },
  { value: 'three', label: 'Option three' },
];

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose weight', description: 'A steady, sustainable deficit.' },
  { value: 'build', label: 'Build muscle', description: 'Progressive overload, slight surplus.' },
  { value: 'maintain', label: 'Maintain', description: 'Hold steady, improve composition.' },
];

const UNIT_OPTIONS = [
  { value: 'metric', label: 'Metric (cm, kg)' },
  { value: 'imperial', label: 'Imperial (ft, lb)' },
];
</script>

<!-- The wrapper is the dark-mode boundary: `dark` here flips every descendant,
     and bg-background on the wrapper itself repaints. Portalled dropdowns
     (select) escape it — accepted cosmetic limit. -->
<div
  class={`grid w-full gap-12 rounded-xl border bg-background p-6 text-foreground ${isDark ? 'dark' : ''}`}
  data-testid="gallery-root"
>
  <div class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground">
      Rendered by the Svelte kit — hand-written wrappers over Bits UI.
    </p>
    <Button variant="ghost" aria-pressed={isDark} onclick={() => (isDark = !isDark)}>
      Toggle dark mode
    </Button>
  </div>

  <section class="grid gap-4">
    <h2 class="text-lg font-semibold">Tokens</h2>
    {#each TOKEN_GROUPS as group (group.title)}
      <div class="grid gap-2">
        <h3 class="text-sm font-medium text-muted-foreground">{group.title}</h3>
        <div class="flex flex-wrap gap-3">
          {#each group.tokens as token (token.label)}
            <div class="grid gap-1">
              <div
                class="flex h-14 w-24 items-center justify-center rounded-md border text-sm"
                style={`background: var(${token.bg});${token.fg ? ` color: var(${token.fg});` : ''}`}
                data-token={token.label}
              >
                {#if token.fg}<span>Aa</span>{/if}
              </div>
              <span class="text-xs text-muted-foreground">{token.label}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
    <p class="text-xs italic text-muted-foreground">{noteText('unused-tokens')}</p>

    <h3 class="text-sm font-medium text-muted-foreground">Radius</h3>
    <div class="flex flex-wrap gap-3">
      {#each RADII as radius (radius.label)}
        <div class="grid gap-1">
          <div class={`h-14 w-24 border bg-muted ${radius.class}`}></div>
          <span class="text-xs text-muted-foreground">{radius.label}</span>
        </div>
      {/each}
    </div>
  </section>

  <section class="grid gap-6">
    <h2 class="text-lg font-semibold">Primitives</h2>

    <div class="grid gap-2">
      <h3 class="text-sm font-medium text-muted-foreground">Button — variants</h3>
      <div class="flex flex-wrap items-center gap-3">
        {#each SVELTE_BUTTON_VARIANTS as variant (variant)}
          <Button {variant}>{variant}</Button>
        {/each}
        <Button disabled>disabled</Button>
      </div>
      <p class="text-xs italic text-muted-foreground">{noteText('button-kit')}</p>
    </div>

    <div class="grid max-w-md gap-3">
      <h3 class="text-sm font-medium text-muted-foreground">Input, label, checkbox, progress</h3>
      <div class="grid gap-2">
        <Label for="demo-input">Label</Label>
        <Input id="demo-input" placeholder="Placeholder text" />
        <Input value="Disabled" disabled />
        <Input value="Invalid" aria-invalid="true" />
      </div>
      <div class="flex items-center gap-3">
        <Checkbox
          id="demo-checkbox"
          checked={demoChecked}
          onCheckedChange={(checked) => (demoChecked = checked)}
        />
        <Label for="demo-checkbox">Checkbox</Label>
      </div>
      <Progress value={60} />
    </div>

    <div class="grid max-w-md gap-2">
      <h3 class="text-sm font-medium text-muted-foreground">Select</h3>
      <Select
        id="demo-select"
        value={demoSelect}
        options={DEMO_OPTIONS}
        placeholder="Options-driven select"
        onValueChange={(value) => (demoSelect = value)}
      />
      <Select
        id="demo-select-invalid"
        value=""
        options={DEMO_OPTIONS}
        placeholder="invalid={true} — a prop Vue lacks"
        invalid={true}
        onValueChange={noop}
      />
      <p class="text-xs italic text-muted-foreground">{noteText('select-shape')}</p>
    </div>

    <div class="grid max-w-md gap-2">
      <h3 class="text-sm font-medium text-muted-foreground">Radio cards & segmented</h3>
      <RadioCards
        name="demo-goal"
        value={demoGoal}
        options={GOAL_OPTIONS}
        onValueChange={(value) => (demoGoal = value)}
      />
      <Segmented
        name="demo-units"
        value={demoUnits}
        options={UNIT_OPTIONS}
        onValueChange={(value) => (demoUnits = value)}
      />
      <p class="text-xs italic text-muted-foreground">{noteText('choice-wrappers')}</p>
    </div>

    <div class="grid max-w-md gap-2">
      <h3 class="text-sm font-medium text-muted-foreground">Card</h3>
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="grid gap-1.5 px-6 pt-6">
          <h4 class="text-lg font-semibold leading-none">Card title</h4>
          <p class="text-sm text-muted-foreground">Hand-rolled — there is no Card primitive.</p>
        </div>
        <div class="px-6 py-6">
          <p class="text-sm text-muted-foreground">Content sits here.</p>
        </div>
      </div>
      <p class="text-xs italic text-muted-foreground">{noteText('card-kit')}</p>
    </div>
  </section>

  <section class="grid gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Field kinds</h2>
      <Button variant="ghost" onclick={toggleValidation}>
        {stepAttempted ? 'Hide validation' : 'Show validation'}
      </Button>
    </div>
    <p class="text-sm text-muted-foreground">
      Every kind rendered through the real FieldRenderer against a live TanStack form. Nothing here
      submits anywhere.
    </p>

    <div class="grid grid-cols-2 gap-6">
      {#each GALLERY_FIELDS as field (field.name)}
        <div class={field.span === 'half' ? 'col-span-1' : 'col-span-2'}>
          {#if field.kind === 'repeater'}
            <RepeaterField
              {field}
              {form}
              {stepAttempted}
              serverErrors={{}}
              onClearServerError={noop}
            />
          {:else}
            <FieldRenderer {field} {form} {stepAttempted} onClearServerError={noop} />
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <section class="grid gap-4">
    <h2 class="text-lg font-semibold">Composite cards</h2>
    <p class="text-sm text-muted-foreground">
      Sample data computed by the real plan and workout engines.
    </p>
    <PlanCard plan={demoPlan} />
    <WorkoutSummaryCard workout={demoWorkout} />
  </section>
</div>
