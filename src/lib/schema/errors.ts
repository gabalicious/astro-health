export type FieldErrorMap = Record<string, string[]>;

/**
 * Structural, not `z.ZodError`: the Hono validator hands over Zod 4's core
 * `$ZodError`, and issues are all this needs.
 */
interface IssueLike {
  message: string;
  path: ReadonlyArray<PropertyKey>;
}

/**
 * Folds Zod issue paths into the same names the client uses for its fields:
 * numbers become bracketed indices, keys become dotted segments, so a bad set
 * lands on exactly `sets[1].reps`.
 *
 * `z.flattenError` only reaches the top level and would file every set error
 * under `sets`, leaving the renderer unable to say which row was wrong.
 */
export function fieldErrorsFromIssues(error: { issues: readonly IssueLike[] }): FieldErrorMap {
  const errors: FieldErrorMap = {};

  for (const issue of error.issues) {
    const name = issue.path.reduce<string>((path, segment) => {
      if (typeof segment === 'number') return `${path}[${segment}]`;
      return path ? `${path}.${String(segment)}` : String(segment);
    }, '');

    // A form-level issue has an empty path; keep it out of the field map.
    if (!name) continue;

    const existing = errors[name] ?? [];
    existing.push(issue.message);
    errors[name] = existing;
  }

  return errors;
}
