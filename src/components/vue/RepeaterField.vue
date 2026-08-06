<script setup lang="ts" generic="TValues extends DraftValues">
import FieldRenderer from '@/components/vue/FieldRenderer.vue';
import { Button } from '@/components/vue/ui/button';
import type { FieldErrors } from '@/lib/api';
import {
  type DraftRow,
  type DraftValues,
  groupErrorMessages,
  type RepeaterFieldConfig,
  rowFieldName,
} from '@/lib/forms/types';

const props = defineProps<{
  field: RepeaterFieldConfig<TValues>;
  // biome-ignore lint/suspicious/noExplicitAny: TanStack keys its generics to literal field names.
  form: any;
  stepAttempted: boolean;
  /** The whole map — rows look themselves up by `sets[0].reps`. */
  serverErrors: FieldErrors;
}>();

const emit = defineEmits<(event: 'clearServerError', name: string) => void>();

const minRows = props.field.minRows ?? 0;
const maxRows = props.field.maxRows ?? Number.POSITIVE_INFINITY;

const rowsOf = (value: unknown): DraftRow[] => (Array.isArray(value) ? value : []);

function labelFor(index: number) {
  return props.field.rowLabel?.(index) ?? `${props.field.label} ${index + 1}`;
}

/** Array-level rules ("at least one set") only once the user has tried to submit. */
function arrayErrors(fieldErrors: readonly unknown[]): string[] {
  const server = props.serverErrors[props.field.name] ?? [];
  if (server.length > 0) return server;
  return props.stepAttempted ? groupErrorMessages(fieldErrors) : [];
}
</script>

<template>
  <form.Field :name="field.name" mode="array" :validators="{ onChange: field.schema }">
    <template v-slot="{ field: f }">
      <div class="grid gap-3">
        <div class="grid gap-1">
          <span class="text-sm font-medium">{{ field.label }}</span>
          <p v-if="field.hint" class="text-sm text-muted-foreground">{{ field.hint }}</p>
        </div>

        <div
          v-for="(_row, index) in rowsOf(f.state.value)"
          :key="index"
          class="grid gap-4 rounded-lg border border-input p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">{{ labelFor(index) }}</span>
            <button
              type="button"
              class="text-sm text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
              :disabled="rowsOf(f.state.value).length <= minRows"
              @click="f.removeValue(index)"
            >
              Remove
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="item in field.itemFields"
              :key="item.name"
              :class="item.span === 'half' ? 'col-span-1' : 'col-span-2'"
            >
              <FieldRenderer
                :field="item"
                :name="rowFieldName(field.name, index, item.name)"
                :form="form"
                :step-attempted="stepAttempted"
                :server-errors="serverErrors[rowFieldName(field.name, index, item.name)]"
                @clear-server-error="(name: string) => emit('clearServerError', name)"
              />
            </div>
          </div>
        </div>

        <p
          v-for="message in arrayErrors(f.state.meta.errors)"
          :key="message"
          class="text-sm text-destructive"
        >
          {{ message }}
        </p>

        <Button
          variant="ghost"
          class="justify-self-start"
          :disabled="rowsOf(f.state.value).length >= maxRows"
          @click="f.pushValue({ ...field.itemDefaults })"
        >
          {{ field.addLabel }}
        </Button>
      </div>
    </template>
  </form.Field>
</template>
