import { z } from 'zod';

/**
 * Numeric fields live in form state as strings (that is what a DOM input gives
 * us) and come out of the schema as numbers, so the schema doubles as the parse
 * boundary. Shared by every form that collects a number.
 */

export interface NumericOptions {
  min: number;
  max: number;
  int?: boolean;
}

export function numeric(label: string, { min, max, int = false }: NumericOptions) {
  let value = z
    .number({ error: `${label} must be a number.` })
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

  if (int) {
    value = value.int(`${label} must be a whole number.`);
  }

  // `Number` rather than `z.coerce.number()`: coercion widens the input type to
  // `unknown`, which cannot be piped from a string.
  return z.string().trim().min(1, `${label} is required.`).transform(Number).pipe(value);
}

export function optionalNumeric(label: string, options: NumericOptions) {
  return z
    .union([z.literal(''), numeric(label, options)])
    .transform((value) => (value === '' ? undefined : value));
}

export const round1 = (value: number) => Math.round(value * 10) / 10;
