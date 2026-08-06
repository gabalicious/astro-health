<script setup lang="ts" generic="TValues extends Record<string, string>">
import { computed } from 'vue';
import { Checkbox } from '@/components/vue/ui/checkbox';
import { Input } from '@/components/vue/ui/input';
import { Label } from '@/components/vue/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/vue/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/vue/ui/select';
import { errorMessages, type FieldConfig } from '@/lib/forms/types';

const props = defineProps<{
  field: FieldConfig<TValues>;
  // The TanStack form instance. Its generics are keyed to literal field names,
  // so a generator that iterates over config can only see it loosely typed.
  // biome-ignore lint/suspicious/noExplicitAny: see above
  form: any;
  /** Set once the user has tried to leave the step, so errors stop hiding. */
  stepAttempted: boolean;
  serverErrors?: string[];
}>();

const emit = defineEmits<(event: 'clearServerError', name: string) => void>();

const inputType = computed(() =>
  props.field.kind === 'number' ? 'text' : (props.field.kind ?? 'text'),
);

// Numbers stay in form state as strings, so a plain text input with a numeric
// keypad beats type="number" (no scroll-to-change, no locale surprises).
const inputMode = computed(() => (props.field.kind === 'number' ? 'decimal' : undefined));

function visibleErrors(fieldErrors: readonly unknown[], isBlurred: boolean): string[] {
  const server = props.serverErrors ?? [];
  if (server.length > 0) return server;
  if (!isBlurred && !props.stepAttempted) return [];
  return errorMessages(fieldErrors);
}

// reka-ui emits `AcceptableValue` and the input emits `string | number`; form
// state is always a string, so normalise here rather than at every call site.
function onChange(handleChange: (value: string) => void, value: unknown) {
  handleChange(value == null ? '' : String(value));
  if (props.serverErrors?.length) emit('clearServerError', props.field.name);
}
</script>

<template>
  <form.Field
    :name="field.name"
    :validators="{ onChange: field.schema }"
  >
    <template v-slot="{ field: f }">
      <div class="grid gap-2">
        <!-- Checkboxes label to the right; every other kind labels above. -->
        <div v-if="field.kind !== 'checkbox'" class="grid gap-1">
          <Label :for="field.name" class="text-sm font-medium">{{ field.label }}</Label>
          <p v-if="field.hint" class="text-sm text-muted-foreground">{{ field.hint }}</p>
        </div>

        <div v-if="field.kind === 'checkbox'" class="flex items-start gap-3">
          <Checkbox
            :id="field.name"
            :model-value="f.state.value === 'true'"
            class="mt-0.5"
            @update:model-value="(v: unknown) => onChange(f.handleChange, v === true ? 'true' : '')"
          />
          <div class="grid gap-1">
            <Label :for="field.name" class="text-sm font-medium">{{ field.label }}</Label>
            <p v-if="field.hint" class="text-sm text-muted-foreground">{{ field.hint }}</p>
          </div>
        </div>

        <!-- A two-option unit switch wants a compact toggle, not stacked cards. -->
        <RadioGroup
          v-else-if="field.kind === 'segmented'"
          :model-value="f.state.value"
          class="grid-flow-col auto-cols-fr gap-1 rounded-lg bg-muted p-1"
          @update:model-value="(value: unknown) => onChange(f.handleChange, value)"
        >
          <label
            v-for="option in field.options"
            :key="option.value"
            :for="`${field.name}-${option.value}`"
            class="flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors has-[[data-state=checked]]:bg-background has-[[data-state=checked]]:text-foreground has-[[data-state=checked]]:shadow-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          >
            <RadioGroupItem
              :id="`${field.name}-${option.value}`"
              :value="option.value"
              class="sr-only"
            />
            {{ option.label }}
          </label>
        </RadioGroup>

        <!-- Cards read far better than bare radios for a small set of choices. -->
        <RadioGroup
          v-else-if="field.kind === 'radio-cards'"
          :model-value="f.state.value"
          class="gap-2"
          @update:model-value="(value: unknown) => onChange(f.handleChange, value)"
        >
          <label
            v-for="option in field.options"
            :key="option.value"
            :for="`${field.name}-${option.value}`"
            class="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-accent/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem
              :id="`${field.name}-${option.value}`"
              :value="option.value"
              class="mt-0.5"
            />
            <span class="grid gap-1">
              <span class="text-sm font-medium leading-none">{{ option.label }}</span>
              <span v-if="option.description" class="text-sm text-muted-foreground">
                {{ option.description }}
              </span>
            </span>
          </label>
        </RadioGroup>

        <Select
          v-else-if="field.kind === 'select'"
          :model-value="f.state.value || undefined"
          @update:model-value="(value: unknown) => onChange(f.handleChange, value)"
        >
          <SelectTrigger :id="field.name" class="w-full">
            <SelectValue :placeholder="field.placeholder ?? 'Select an option'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div v-else class="relative">
          <Input
            :id="field.name"
            :type="inputType"
            :inputmode="inputMode"
            :placeholder="field.placeholder"
            :autocomplete="field.autocomplete"
            :model-value="f.state.value"
            :aria-invalid="visibleErrors(f.state.meta.errors, f.state.meta.isBlurred).length > 0"
            :class="field.unit ? 'pr-12' : undefined"
            @blur="f.handleBlur"
            @update:model-value="(value: unknown) => onChange(f.handleChange, value)"
          />
          <span
            v-if="field.unit"
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
          >
            {{ field.unit }}
          </span>
        </div>

        <p
          v-for="message in visibleErrors(f.state.meta.errors, f.state.meta.isBlurred)"
          :key="message"
          class="text-sm text-destructive"
        >
          {{ message }}
        </p>
      </div>
    </template>
  </form.Field>
</template>
