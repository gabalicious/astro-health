import type { z } from 'zod';

/**
 * A tiny, framework-agnostic description of a multi-step form. The Vue and
 * Svelte wizards both render from one of these and share nothing else, so any
 * difference between the two pages is a difference between the frameworks
 * rather than between two hand-built forms.
 */

/** One row of a repeater. Still all-string, like every other draft. */
export type DraftRow = Record<string, string>;

/**
 * What a draft may hold: a string per field, or an array of rows for a
 * repeater. Draft types stay `type` aliases (not interfaces) so they satisfy
 * this index signature.
 */
export type DraftValues = Record<string, string | DraftRow[]>;

/** Kinds that render a single control bound to a single string. */
export type ScalarFieldKind =
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

export type FieldKind = ScalarFieldKind | 'repeater';

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

interface BaseFieldConfig<TValues> {
  name: Extract<keyof TValues, string>;
  label: string;
  /** Helper text shown under the label, before the user has made a mistake. */
  hint?: string;
  /** Layout hint: `half` lets two fields share a row, e.g. feet and inches. */
  span?: 'full' | 'half';
  /**
   * Validated whenever the field is visible. Conditional fields are therefore
   * "required when shown" without any cross-field logic in the renderer.
   */
  schema: z.ZodType;
  showIf?: (values: TValues) => boolean;
}

export interface ScalarFieldConfig<TValues> extends BaseFieldConfig<TValues> {
  kind: ScalarFieldKind;
  placeholder?: string;
  autocomplete?: string;
  /** Suffix rendered inside number inputs, e.g. "cm". */
  unit?: string;
  /** Required for `select`, `radio-cards` and `segmented`. */
  options?: readonly FieldOption[];
}

/** A repeated group of fields — sets in a workout, and so on. */
export interface RepeaterFieldConfig<TValues> extends BaseFieldConfig<TValues> {
  kind: 'repeater';
  /** Fields for ONE row. Their names are keys of the row, not of TValues. */
  itemFields: readonly ScalarFieldConfig<DraftRow>[];
  /** Spread on every add — never share one object between rows. */
  itemDefaults: DraftRow;
  addLabel: string;
  rowLabel?: (index: number) => string;
  minRows?: number;
  maxRows?: number;
}

export type FieldConfig<TValues> = ScalarFieldConfig<TValues> | RepeaterFieldConfig<TValues>;

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

/**
 * Deep-copies a draft so array-valued defaults are never shared between form
 * instances.
 *
 * Deliberately not `structuredClone`: both frameworks hand back reactive
 * proxies (Vue's `ref` especially), which it refuses to clone. A draft only
 * ever holds strings and arrays of string rows, so copying it is this small.
 */
export function cloneDraft<TValues extends DraftValues>(values: TValues): TValues {
  const copy: DraftValues = {};

  for (const [key, value] of Object.entries(values)) {
    copy[key] = Array.isArray(value) ? value.map((row) => ({ ...row })) : value;
  }

  return copy as TValues;
}

/**
 * TanStack addresses nested values with brackets for indices and dots for keys.
 * `sets.2.reps` is not a valid path; `sets[2].reps` is.
 */
export function rowFieldName(arrayName: string, index: number, key: string): string {
  return `${arrayName}[${index}].${key}`;
}

/** Fields the user should see and be validated against, given current answers. */
export function visibleFields<TValues>(
  step: StepConfig<TValues>,
  values: TValues,
): FieldConfig<TValues>[] {
  return step.fields.filter((field) => field.showIf?.(values) ?? true);
}

/**
 * Every field name the submit gate has to validate. A repeater contributes its
 * own name (so array-level rules like "at least one set" run) plus one name per
 * cell of every current row.
 */
export function validationNames<TValues extends DraftValues>(
  fields: readonly FieldConfig<TValues>[],
  values: TValues,
): string[] {
  return fields.flatMap((field) => {
    if (field.kind !== 'repeater') return [field.name];

    const rows = (values[field.name] as DraftRow[] | undefined) ?? [];
    return [
      field.name,
      ...rows.flatMap((_, index) =>
        field.itemFields.map((item) => rowFieldName(field.name, index, item.name)),
      ),
    ];
  });
}

/**
 * Which step owns a field. Used to bounce the user back to the right step when
 * the server rejects something they entered earlier. Nested names like
 * `sets[0].reps` resolve to the step owning `sets`.
 */
export function stepIndexOfField<TValues>(
  config: WizardConfig<TValues>,
  name: string,
): number | undefined {
  const root = name.split(/[.[]/, 1)[0];
  const index = config.steps.findIndex((step) => step.fields.some((f) => f.name === root));
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

/**
 * Messages belonging to a repeater itself rather than to one of its rows.
 *
 * A Zod array schema reports the rows' problems too, each carrying a path like
 * `[1, 'reps']`. Those are already rendered under the offending input, so
 * repeating them beneath the group would say everything twice.
 */
export function groupErrorMessages(errors: readonly unknown[]): string[] {
  return errorMessages(
    errors.filter((error) => {
      const path = (error as { path?: readonly unknown[] } | null)?.path;
      return !path || path.length === 0;
    }),
  );
}
