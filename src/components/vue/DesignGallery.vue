<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { useForm } from '@tanstack/vue-form';
import { ref } from 'vue';
import FieldRenderer from '@/components/vue/FieldRenderer.vue';
import PlanCard from '@/components/vue/PlanCard.vue';
import RepeaterField from '@/components/vue/RepeaterField.vue';
import { Button } from '@/components/vue/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/vue/ui/card';
import { Checkbox } from '@/components/vue/ui/checkbox';
import { Input } from '@/components/vue/ui/input';
import { Label } from '@/components/vue/ui/label';
import { Progress } from '@/components/vue/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/vue/ui/select';
import WorkoutSummaryCard from '@/components/vue/WorkoutSummaryCard.vue';
import {
  demoPlan,
  demoWorkout,
  GALLERY_FIELDS,
  galleryDefaults,
  noteText,
  TOKEN_GROUPS,
  VUE_BUTTON_SIZES,
  VUE_BUTTON_VARIANTS,
} from '@/lib/design-gallery';
import { cloneDraft, validationNames } from '@/lib/forms/types';

const isDark = ref(false);
const stepAttempted = ref(false);
const demoChecked = ref(false);
const demoSelect = ref<string | undefined>(undefined);

const form = useForm({ defaultValues: cloneDraft(galleryDefaults) });
const values = form.useSelector((state) => state.values);

async function toggleValidation() {
  if (stepAttempted.value) {
    stepAttempted.value = false;
    return;
  }

  stepAttempted.value = true;
  // Untouched fields have no errors until a validator runs — same gate as
  // FormWizard's submit, otherwise this toggle appears to do nothing.
  await Promise.all(
    validationNames(GALLERY_FIELDS, values.value).map((name) =>
      // as never: validationNames returns plain strings, but this concrete form
      // wants its DeepKeys literal union — same cast the engine uses.
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
</script>

<template>
  <!-- The wrapper is the dark-mode boundary: `dark` here flips every
       descendant, and bg-background on the wrapper itself repaints.
       Portalled dropdowns (select) escape it — accepted cosmetic limit. -->
  <div
    :class="[
      'grid w-full gap-12 rounded-xl border bg-background p-6 text-foreground',
      isDark && 'dark',
    ]"
    data-testid="gallery-root"
  >
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Rendered by the Vue kit — shadcn-vue over reka-ui.
      </p>
      <Button variant="outline" size="sm" :aria-pressed="isDark" @click="isDark = !isDark">
        Toggle dark mode
      </Button>
    </div>

    <section class="grid gap-4">
      <h2 class="text-lg font-semibold">Tokens</h2>
      <div v-for="group in TOKEN_GROUPS" :key="group.title" class="grid gap-2">
        <h3 class="text-sm font-medium text-muted-foreground">{{ group.title }}</h3>
        <div class="flex flex-wrap gap-3">
          <div v-for="token in group.tokens" :key="token.label" class="grid gap-1">
            <div
              class="flex h-14 w-24 items-center justify-center rounded-md border text-sm"
              :style="{
                background: `var(${token.bg})`,
                color: token.fg ? `var(${token.fg})` : undefined,
              }"
              :data-token="token.label"
            >
              <span v-if="token.fg">Aa</span>
            </div>
            <span class="text-xs text-muted-foreground">{{ token.label }}</span>
          </div>
        </div>
      </div>
      <p class="text-xs italic text-muted-foreground">{{ noteText('unused-tokens') }}</p>

      <h3 class="text-sm font-medium text-muted-foreground">Radius</h3>
      <div class="flex flex-wrap gap-3">
        <div v-for="radius in RADII" :key="radius.label" class="grid gap-1">
          <div :class="['h-14 w-24 border bg-muted', radius.class]"></div>
          <span class="text-xs text-muted-foreground">{{ radius.label }}</span>
        </div>
      </div>
    </section>

    <section class="grid gap-6">
      <h2 class="text-lg font-semibold">Primitives</h2>

      <div class="grid gap-2">
        <h3 class="text-sm font-medium text-muted-foreground">Button — variants</h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button v-for="variant in VUE_BUTTON_VARIANTS" :key="variant" :variant="variant">
            {{ variant }}
          </Button>
          <Button disabled>disabled</Button>
        </div>
        <h3 class="text-sm font-medium text-muted-foreground">Button — sizes</h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button v-for="size in VUE_BUTTON_SIZES" :key="size" variant="outline" :size="size">
            {{ size }}
          </Button>
          <Button variant="outline" size="icon" aria-label="Add">
            <Plus />
          </Button>
        </div>
        <p class="text-xs italic text-muted-foreground">{{ noteText('button-kit') }}</p>
      </div>

      <div class="grid max-w-md gap-3">
        <h3 class="text-sm font-medium text-muted-foreground">Input, label, checkbox, progress</h3>
        <div class="grid gap-2">
          <Label for="demo-input">Label</Label>
          <Input id="demo-input" placeholder="Placeholder text" />
          <Input model-value="Disabled" disabled />
          <Input model-value="Invalid" aria-invalid="true" />
        </div>
        <div class="flex items-center gap-3">
          <Checkbox
            id="demo-checkbox"
            :model-value="demoChecked"
            @update:model-value="(v: unknown) => (demoChecked = v === true)"
          />
          <Label for="demo-checkbox">Checkbox</Label>
        </div>
        <Progress :model-value="60" />
      </div>

      <div class="grid max-w-md gap-2">
        <h3 class="text-sm font-medium text-muted-foreground">Select</h3>
        <Select
          :model-value="demoSelect"
          @update:model-value="(v: unknown) => (demoSelect = v == null ? undefined : String(v))"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Compound select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">Option one</SelectItem>
            <SelectItem value="two">Option two</SelectItem>
            <SelectItem value="three">Option three</SelectItem>
          </SelectContent>
        </Select>
        <p class="text-xs italic text-muted-foreground">{{ noteText('select-shape') }}</p>
        <p class="text-xs italic text-muted-foreground">{{ noteText('choice-wrappers') }}</p>
      </div>

      <div class="grid max-w-md gap-2">
        <h3 class="text-sm font-medium text-muted-foreground">Card</h3>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>All seven compound pieces, straight from shadcn-vue.</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">Content sits here.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm">Footer action</Button>
          </CardFooter>
        </Card>
        <p class="text-xs italic text-muted-foreground">{{ noteText('card-kit') }}</p>
      </div>
    </section>

    <section class="grid gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Field kinds</h2>
        <Button variant="secondary" size="sm" @click="toggleValidation">
          {{ stepAttempted ? 'Hide validation' : 'Show validation' }}
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        Every kind rendered through the real FieldRenderer against a live TanStack form. Nothing
        here submits anywhere.
      </p>

      <div class="grid grid-cols-2 gap-6">
        <div
          v-for="field in GALLERY_FIELDS"
          :key="field.name"
          :class="field.span === 'half' ? 'col-span-1' : 'col-span-2'"
        >
          <RepeaterField
            v-if="field.kind === 'repeater'"
            :field="field"
            :form="form"
            :step-attempted="stepAttempted"
            :server-errors="{}"
          />
          <FieldRenderer
            v-else
            :field="field"
            :form="form"
            :step-attempted="stepAttempted"
          />
        </div>
      </div>
    </section>

    <section class="grid gap-4">
      <h2 class="text-lg font-semibold">Composite cards</h2>
      <p class="text-sm text-muted-foreground">
        Sample data computed by the real plan and workout engines.
      </p>
      <PlanCard :plan="demoPlan" />
      <WorkoutSummaryCard :workout="demoWorkout" />
    </section>
  </div>
</template>
