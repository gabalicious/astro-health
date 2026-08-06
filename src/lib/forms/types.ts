import type { z } from 'zod';

/**
 * A tiny, framework-agnostic description of a multi-step form. The Vue and
 * Svelte wizards both render from one of these and share nothing else, so any
 * difference between the two pages is a difference between the frameworks
 * rather than between two hand-built forms.
 */

export type FieldKind =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'select'
  | 'radio-cards'
  /** Compact two-or-three option toggle, e.g. metric vs imperial. */
  | 'segmented'
  /**
   * Inline checkbox (control left, label right). Draft value is '' | 'true' so
   * form values stay all-string.
   */
  | 'checkbox';

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldConfig<TValues> {
  name: Extract<keyof TValues, string>;
  kind: FieldKind;
  label: string;
  /** Helper text shown under the label, before the user has made a mistake. */
  hint?: string;
  placeholder?: string;
  autocomplete?: string;
  /** Suffix rendered inside number inputs, e.g. "cm". */
  unit?: string;
  /** Required for `select`, `radio-cards` and `segmented`. */
  options?: readonly FieldOption[];
  /** Layout hint: `half` lets two fields share a row, e.g. feet and inches. */
  span?: 'full' | 'half';
  /**
   * Validated whenever the field is visible. Conditional fields are therefore
   * "required when shown" without any cross-field logic in the renderer.
   */
  schema: z.ZodType;
  showIf?: (values: TValues) => boolean;
}

export interface StepConfig<TValues> {
  id: string;
  title: string;
  description?: string;
  fields: readonly FieldConfig<TValues>[];
}

export interface WizardConfig<TValues> {
  id: string;
  steps: readonly StepConfig<TValues>[];
  defaults: TValues;
}

/** Fields the user should see and be validated against, given current answers. */
export function visibleFields<TValues>(
  step: StepConfig<TValues>,
  values: TValues,
): FieldConfig<TValues>[] {
  return step.fields.filter((field) => field.showIf?.(values) ?? true);
}

/**
 * Which step owns a field. Used to bounce the user back to the right step when
 * the server rejects something they entered earlier.
 */
export function stepIndexOfField<TValues>(
  config: WizardConfig<TValues>,
  name: string,
): number | undefined {
  const index = config.steps.findIndex((step) => step.fields.some((f) => f.name === name));
  return index === -1 ? undefined : index;
}

/**
 * TanStack Form surfaces Standard Schema issues as objects and custom
 * validators as plain strings; both renderers display them the same way.
 */
export function errorMessages(errors: readonly unknown[]): string[] {
  const messages = errors.flatMap((error) => {
    if (!error) return [];
    if (typeof error === 'string') return [error];
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? [message] : [];
  });

  return [...new Set(messages)];
}
