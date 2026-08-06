<script setup lang="ts">
import FormWizard from '@/components/vue/FormWizard.vue';
import { submitSignup } from '@/lib/api';
import { signupForm } from '@/lib/forms/signup-form';

const props = defineProps<{ next: string }>();

function goToOnboarding() {
  window.location.href = props.next;
}
</script>

<template>
  <FormWizard
    :config="signupForm"
    :submit="submitSignup"
    submit-label="Create account"
    submitting-label="Creating your account…"
    success-title="Account created"
    success-description="Taking you to setup…"
    :on-success="goToOnboarding"
  />
</template>
