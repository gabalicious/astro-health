<script lang="ts">
import FormWizard from '@/components/svelte/FormWizard.svelte';
import PlanCard from '@/components/svelte/PlanCard.svelte';
import { fetchProfile, submitLogout, submitProfile } from '@/lib/api';
import { onboardingWizard } from '@/lib/forms/onboarding-wizard';
import { draftFromProfile, type ProfileDraft } from '@/lib/schema/profile';

let {
  loginHref,
  onboardingHref,
  settingsHref,
}: {
  loginHref: string;
  onboardingHref: string;
  settingsHref: string;
} = $props();

let loadState = $state<'loading' | 'ready' | 'error'>('loading');
let initialValues = $state<ProfileDraft | null>(null);

$effect(() => {
  fetchProfile().then((result) => {
    if (result.status === 'unauthenticated') {
      window.location.href = loginHref;
      return;
    }
    if (result.status === 'no-profile') {
      window.location.href = onboardingHref;
      return;
    }
    if (result.status === 'error') {
      loadState = 'error';
      return;
    }

    initialValues = draftFromProfile(result.profile);
    loadState = 'ready';
  });
});

async function logout() {
  await submitLogout();
  window.location.href = loginHref;
}
</script>

<div class="grid w-full max-w-xl gap-4">
  {#if loadState === 'loading'}
    <p class="text-sm text-muted-foreground">Loading your settings…</p>
  {:else if loadState === 'error'}
    <p class="text-sm text-destructive" role="alert">
      Could not load your settings. Refresh to try again.
    </p>
  {/if}

  {#if loadState === 'ready' && initialValues}
    <FormWizard
      config={onboardingWizard}
      submit={submitProfile}
      mode="single"
      {initialValues}
      submitLabel="Save changes"
      submittingLabel="Saving…"
      successTitle="Saved"
      successDescription="Your plan is up to date."
    >
      {#snippet success({ result })}
        <div class="grid w-full max-w-xl gap-4">
          <PlanCard plan={result.plan} />
          <a href={settingsHref} class="text-sm text-primary hover:underline">Adjust again</a>
        </div>
      {/snippet}
    </FormWizard>

    <button
      type="button"
      class="justify-self-start text-sm text-muted-foreground hover:text-foreground"
      onclick={logout}
    >
      Log out
    </button>
  {/if}
</div>
