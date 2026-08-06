<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FormWizard from '@/components/vue/FormWizard.vue';
import PlanCard from '@/components/vue/PlanCard.vue';
import { fetchProfile, submitLogout, submitProfile } from '@/lib/api';
import { onboardingWizard } from '@/lib/forms/onboarding-wizard';
import { draftFromProfile, type ProfileDraft } from '@/lib/schema/profile';

const props = defineProps<{
  loginHref: string;
  onboardingHref: string;
  settingsHref: string;
}>();

const state = ref<'loading' | 'ready' | 'error'>('loading');
const initialValues = ref<ProfileDraft | null>(null);

onMounted(async () => {
  const result = await fetchProfile();

  if (result.status === 'unauthenticated') {
    window.location.href = props.loginHref;
    return;
  }
  if (result.status === 'no-profile') {
    window.location.href = props.onboardingHref;
    return;
  }
  if (result.status === 'error') {
    state.value = 'error';
    return;
  }

  initialValues.value = draftFromProfile(result.profile);
  state.value = 'ready';
});

async function logout() {
  await submitLogout();
  window.location.href = props.loginHref;
}
</script>

<template>
  <div class="grid w-full max-w-xl gap-4">
    <p v-if="state === 'loading'" class="text-sm text-muted-foreground">Loading your settings…</p>
    <p v-else-if="state === 'error'" class="text-sm text-destructive" role="alert">
      Could not load your settings. Refresh to try again.
    </p>

    <FormWizard
      v-if="state === 'ready' && initialValues"
      :config="onboardingWizard"
      :submit="submitProfile"
      mode="single"
      :initial-values="initialValues"
      submit-label="Save changes"
      submitting-label="Saving…"
      success-title="Saved"
      success-description="Your plan is up to date."
    >
      <template #success="{ result }">
        <div class="grid w-full max-w-xl gap-4">
          <PlanCard :plan="result.plan" />
          <a :href="settingsHref" class="text-sm text-primary hover:underline">Adjust again</a>
        </div>
      </template>
    </FormWizard>

    <button
      v-if="state === 'ready'"
      type="button"
      class="justify-self-start text-sm text-muted-foreground hover:text-foreground"
      @click="logout"
    >
      Log out
    </button>
  </div>
</template>
