<script setup lang="ts">
import FormWizard from '@/components/vue/FormWizard.vue';
import PlanCard from '@/components/vue/PlanCard.vue';
import { submitOnboarding } from '@/lib/api';
import { onboardingWizard } from '@/lib/forms/onboarding-wizard';
</script>

<template>
  <FormWizard
    :config="onboardingWizard"
    :submit="submitOnboarding"
    submit-label="Finish setup"
    submitting-label="Saving your plan…"
    success-title="You're all set"
    success-description="Your plan is ready to go."
  >
    <template #success="{ result }">
      <PlanCard :plan="result.plan" />
    </template>
  </FormWizard>
</template>
