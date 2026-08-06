<script setup lang="ts" generic="TValues extends Record<string, string>">
import { useForm } from '@tanstack/vue-form';
import { computed, ref, watch } from 'vue';
import FieldRenderer from '@/components/vue/FieldRenderer.vue';
import { Button } from '@/components/vue/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/vue/ui/card';
import { Progress } from '@/components/vue/ui/progress';
import type { ApiResult, FieldErrors } from '@/lib/api';
import { stepIndexOfField, visibleFields, type WizardConfig } from '@/lib/forms/types';

type OkResult = Extract<ApiResult, { ok: true }>;

const props = defineProps<{
  config: WizardConfig<TValues>;
  submit: (values: TValues) => Promise<ApiResult>;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successDescription: string;
  /** Lets the caller navigate on success instead of resting on the done card. */
  onSuccess?: (result: { userId: string }) => void;
}>();

defineSlots<{
  /** Replaces the whole success card; omit it to keep the static one. */
  success?: (props: { result: OkResult }) => unknown;
}>();

const steps = props.config.steps;

const form = useForm({ defaultValues: props.config.defaults });
const values = form.useSelector((state) => state.values);

const stepIndex = ref(0);
const stepAttempted = ref(false);
const status = ref<'idle' | 'submitting' | 'done'>('idle');
const serverErrors = ref<FieldErrors>({});
const serverMessage = ref<string | null>(null);
const successResult = ref<OkResult | null>(null);

const step = computed(() => steps[stepIndex.value]);
const fields = computed(() => visibleFields(step.value, values.value));
const isLastStep = computed(() => stepIndex.value === steps.length - 1);
const progress = computed(() => ((stepIndex.value + 1) / steps.length) * 100);
// A one-step form is just a form; the step chrome would be noise.
const showStepChrome = computed(() => steps.length > 1);

// A field the user can no longer see should not keep contributing an answer.
watch(
  values,
  (current) => {
    for (const s of steps) {
      for (const field of s.fields) {
        if (!field.showIf || field.showIf(current)) continue;
        const fallback = props.config.defaults[field.name];
        if (current[field.name] !== fallback) {
          form.setFieldValue(field.name as never, fallback as never);
        }
      }
    }
  },
  { deep: true },
);

function goToStep(index: number, attempted = false) {
  stepIndex.value = index;
  stepAttempted.value = attempted;
}

async function validateStep(): Promise<boolean> {
  // Use this run's results rather than the field's aggregated meta, which can
  // still hold errors recorded under a validation cause that has not re-run.
  const results = await Promise.all(
    fields.value.map((field) => form.validateField(field.name, 'submit')),
  );
  return results.every((errors) => errors.length === 0);
}

async function next() {
  stepAttempted.value = true;
  if (!(await validateStep())) return;

  if (isLastStep.value) await send();
  else goToStep(stepIndex.value + 1);
}

async function send() {
  status.value = 'submitting';
  serverErrors.value = {};
  serverMessage.value = null;

  const result = await props.submit({ ...values.value });

  if (result.ok) {
    successResult.value = result;
    status.value = 'done';
    props.onSuccess?.(result);
    return;
  }

  status.value = 'idle';
  serverErrors.value = result.fieldErrors;
  serverMessage.value = result.message;

  // Send the user back to the earliest step the server took issue with.
  const earliest = Object.keys(result.fieldErrors)
    .map((name) => stepIndexOfField(props.config, name))
    .filter((index): index is number => index !== undefined)
    .sort((a, b) => a - b)[0];

  if (earliest !== undefined) goToStep(earliest, true);
}

function clearServerError(name: string) {
  const { [name]: _removed, ...rest } = serverErrors.value;
  serverErrors.value = rest;
  if (Object.keys(rest).length === 0) serverMessage.value = null;
}
</script>

<template>
  <template v-if="status === 'done' && successResult">
    <slot name="success" :result="successResult">
      <Card class="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{{ successTitle }}</CardTitle>
          <CardDescription>{{ successDescription }}</CardDescription>
        </CardHeader>
      </Card>
    </slot>
  </template>

  <Card v-else class="w-full max-w-xl">
    <CardHeader>
      <div v-if="showStepChrome" class="grid gap-3">
        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {{ stepIndex + 1 }} of {{ steps.length }}</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <Progress :model-value="progress" />
      </div>
      <CardTitle :class="showStepChrome ? 'mt-4' : undefined">{{ step.title }}</CardTitle>
      <CardDescription v-if="step.description">{{ step.description }}</CardDescription>
    </CardHeader>

    <CardContent>
      <form class="grid gap-6" novalidate @submit.prevent="next">
        <p
          v-if="serverMessage"
          class="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {{ serverMessage }}
        </p>

        <div class="grid grid-cols-2 gap-6">
          <div
            v-for="field in fields"
            :key="field.name"
            :class="field.span === 'half' ? 'col-span-1' : 'col-span-2'"
          >
            <FieldRenderer
              :field="field"
              :form="form"
              :step-attempted="stepAttempted"
              :server-errors="serverErrors[field.name]"
              @clear-server-error="clearServerError"
            />
          </div>
        </div>

        <!-- Keeps Enter-to-submit working without a second visible button. -->
        <button type="submit" class="hidden" tabindex="-1" aria-hidden="true" />
      </form>
    </CardContent>

    <CardFooter class="justify-between">
      <Button
        v-if="showStepChrome"
        variant="ghost"
        :disabled="stepIndex === 0"
        @click="goToStep(stepIndex - 1)"
      >
        Back
      </Button>
      <span v-else />
      <Button :disabled="status === 'submitting'" @click="next">
        {{
          status === 'submitting'
            ? submittingLabel
            : isLastStep
              ? submitLabel
              : 'Continue'
        }}
      </Button>
    </CardFooter>
  </Card>
</template>
