<script lang="ts">
import FormWizard from '@/components/svelte/FormWizard.svelte';
import PlanCard from '@/components/svelte/PlanCard.svelte';
import { submitOnboarding } from '@/lib/api';
import { onboardingWizard } from '@/lib/forms/onboarding-wizard';
</script>

<FormWizard
  config={onboardingWizard}
  submit={submitOnboarding}
  submitLabel="Finish setup"
  submittingLabel="Saving your plan…"
  successTitle="You're all set"
  successDescription="Your plan is ready to go."
>
  {#snippet success({ result })}
    <PlanCard plan={result.plan} />
  {/snippet}
</FormWizard>
