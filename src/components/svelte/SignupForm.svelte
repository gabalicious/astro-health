<script lang="ts">
import FormWizard from '@/components/svelte/FormWizard.svelte';
import { submitSignup } from '@/lib/api';
import { signupForm } from '@/lib/forms/signup-form';

let { next }: { next: string } = $props();
</script>

<FormWizard
  config={signupForm}
  submit={submitSignup}
  submitLabel="Create account"
  submittingLabel="Creating your account…"
  successTitle="Account created"
  successDescription="Taking you to setup…"
  onSuccess={() => {
    window.location.href = next;
  }}
/>
