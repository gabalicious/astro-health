import { describe, expect, it } from 'vitest';
import { fieldErrorsFromIssues } from './errors';

const issues = (...list: { message: string; path: PropertyKey[] }[]) => ({ issues: list });

describe('fieldErrorsFromIssues', () => {
  it('uses brackets for indices and dots for keys', () => {
    const errors = fieldErrorsFromIssues(
      issues({ message: 'Reps is required.', path: ['sets', 1, 'reps'] }),
    );
    expect(errors).toEqual({ 'sets[1].reps': ['Reps is required.'] });
  });

  it('keeps a top-level field name plain', () => {
    const errors = fieldErrorsFromIssues(issues({ message: 'Pick one.', path: ['exerciseId'] }));
    expect(errors).toEqual({ exerciseId: ['Pick one.'] });
  });

  it('collects several messages under one name', () => {
    const errors = fieldErrorsFromIssues(
      issues(
        { message: 'Too small.', path: ['sets', 0, 'weightKg'] },
        { message: 'Not a number.', path: ['sets', 0, 'weightKg'] },
      ),
    );
    expect(errors['sets[0].weightKg']).toEqual(['Too small.', 'Not a number.']);
  });

  it('drops form-level issues, which have no path', () => {
    const errors = fieldErrorsFromIssues(issues({ message: 'Something is off.', path: [] }));
    expect(errors).toEqual({});
  });
});
