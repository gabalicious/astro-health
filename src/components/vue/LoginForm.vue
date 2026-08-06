<script setup lang="ts">
import FormWizard from '@/components/vue/FormWizard.vue';
import { submitLogin } from '@/lib/api';
import { loginForm } from '@/lib/forms/login-form';

const props = defineProps<{ onboardingHref: string; settingsHref: string }>();

function redirect(result: { onboarded?: boolean }) {
  window.location.href = result.onboarded ? props.settingsHref : props.onboardingHref;
}
</script>

<template>
  <FormWizard
    :config="loginForm"
    :submit="submitLogin"
    submit-label="Log in"
    submitting-label="Logging you in…"
    success-title="Welcome back"
    success-description="Taking you to your plan…"
    :on-success="redirect"
  />
</template>
