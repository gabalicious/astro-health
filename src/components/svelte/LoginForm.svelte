<script lang="ts">
import FormWizard from '@/components/svelte/FormWizard.svelte';
import { submitLogin } from '@/lib/api';
import { loginForm } from '@/lib/forms/login-form';

let { onboardingHref, settingsHref }: { onboardingHref: string; settingsHref: string } = $props();
</script>

<FormWizard
  config={loginForm}
  submit={submitLogin}
  submitLabel="Log in"
  submittingLabel="Logging you in…"
  successTitle="Welcome back"
  successDescription="Taking you to your plan…"
  onSuccess={(result) => {
    window.location.href = result.onboarded ? settingsHref : onboardingHref;
  }}
/>
