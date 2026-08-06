import { type ProfileDraft, profileDefaults, profileFieldSchemas } from '@/lib/schema/profile';
import type { FieldConfig, StepConfig, WizardConfig } from './types';

const field = (config: FieldConfig<ProfileDraft>) => config;

const goalStep: StepConfig<ProfileDraft> = {
  id: 'goal',
  title: 'What are you here for?',
  description: 'We tune your daily targets around this. You can change it later.',
  fields: [
    field({
      name: 'goal',
      kind: 'radio-cards',
      label: 'Your primary goal',
      schema: profileFieldSchemas.goal,
      options: [
        {
          value: 'lose_weight',
          label: 'Lose weight',
          description: 'A steady calorie deficit you can actually stick to.',
        },
        {
          value: 'build_muscle',
          label: 'Build muscle',
          description: 'Progressive overload with a slight surplus.',
        },
        {
          value: 'maintain',
          label: 'Maintain weight',
          description: 'Hold steady while improving body composition.',
        },
        {
          value: 'general_fitness',
          label: 'Get fitter',
          description: 'Move more often and build a routine that lasts.',
        },
      ],
    }),
  ],
};

const isMetric = (values: ProfileDraft) => values.unitSystem === 'metric';
const isImperial = (values: ProfileDraft) => values.unitSystem === 'imperial';
const wantsTarget = (values: ProfileDraft) => values.goal === 'lose_weight';

const statsStep: StepConfig<ProfileDraft> = {
  id: 'stats',
  title: 'A few numbers about you',
  description: 'These set your baseline calorie and protein targets.',
  fields: [
    field({
      name: 'unitSystem',
      kind: 'segmented',
      label: 'Units',
      schema: profileFieldSchemas.unitSystem,
      options: [
        { value: 'metric', label: 'Metric (cm, kg)' },
        { value: 'imperial', label: 'Imperial (ft, lb)' },
      ],
    }),
    field({
      name: 'heightCm',
      kind: 'number',
      label: 'Height',
      unit: 'cm',
      placeholder: '175',
      schema: profileFieldSchemas.heightCm,
      showIf: isMetric,
    }),
    field({
      name: 'heightFt',
      kind: 'number',
      label: 'Height (ft)',
      placeholder: '5',
      span: 'half',
      schema: profileFieldSchemas.heightFt,
      showIf: isImperial,
    }),
    field({
      name: 'heightIn',
      kind: 'number',
      label: 'Height (in)',
      placeholder: '9',
      span: 'half',
      schema: profileFieldSchemas.heightIn,
      showIf: isImperial,
    }),
    field({
      name: 'weightKg',
      kind: 'number',
      label: 'Current weight',
      unit: 'kg',
      placeholder: '72',
      schema: profileFieldSchemas.weightKg,
      showIf: isMetric,
    }),
    field({
      name: 'weightLb',
      kind: 'number',
      label: 'Current weight',
      unit: 'lb',
      placeholder: '160',
      schema: profileFieldSchemas.weightLb,
      showIf: isImperial,
    }),
    field({
      name: 'targetWeightKg',
      kind: 'number',
      label: 'Target weight',
      unit: 'kg',
      placeholder: '66',
      hint: 'We pace your plan to reach this at a sustainable rate.',
      schema: profileFieldSchemas.targetWeightKg,
      showIf: (values) => wantsTarget(values) && isMetric(values),
    }),
    field({
      name: 'targetWeightLb',
      kind: 'number',
      label: 'Target weight',
      unit: 'lb',
      placeholder: '145',
      hint: 'We pace your plan to reach this at a sustainable rate.',
      schema: profileFieldSchemas.targetWeightLb,
      showIf: (values) => wantsTarget(values) && isImperial(values),
    }),
    field({
      name: 'age',
      kind: 'number',
      label: 'Age',
      unit: 'yrs',
      placeholder: '29',
      schema: profileFieldSchemas.age,
    }),
    field({
      name: 'sex',
      kind: 'select',
      label: 'Sex at birth',
      hint: 'Used only to estimate your basal metabolic rate.',
      placeholder: 'Select an option',
      schema: profileFieldSchemas.sex,
      options: [
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' },
      ],
    }),
  ],
};

const activityStep: StepConfig<ProfileDraft> = {
  id: 'activity',
  title: 'How active is a normal week?',
  description: 'Count everything outside of deliberate training too.',
  fields: [
    field({
      name: 'activityLevel',
      kind: 'radio-cards',
      label: 'Activity level',
      schema: profileFieldSchemas.activityLevel,
      options: [
        {
          value: 'sedentary',
          label: 'Sedentary',
          description: 'Desk job, little deliberate exercise.',
        },
        {
          value: 'light',
          label: 'Lightly active',
          description: 'Light exercise one to three days a week.',
        },
        {
          value: 'moderate',
          label: 'Moderately active',
          description: 'Moderate exercise three to five days a week.',
        },
        {
          value: 'very_active',
          label: 'Very active',
          description: 'Hard exercise six or seven days a week.',
        },
      ],
    }),
  ],
};

export const onboardingWizard: WizardConfig<ProfileDraft> = {
  id: 'onboarding',
  steps: [goalStep, statsStep, activityStep],
  defaults: profileDefaults,
};
