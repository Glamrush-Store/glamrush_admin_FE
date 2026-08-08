<script setup>
import { ApiError } from "~/composables/apiClient";
import { useStorefrontCampaignStore } from "~/stores/storefrontCampaign";

const route = useRoute();
const campaignStore = useStorefrontCampaignStore();
const storefront = route.params.storefront;
const id = route.params.id;
const serverError = ref("");

const initialValues = computed(() => ({
  ...(campaignStore.campaign || {}),
  storefront_slug: storefront,
}));

async function onSubmit({ formData }) {
  serverError.value = "";
  try {
    await campaignStore.updateCampaign(storefront, id, formData);
    navigateTo(`/storefront-campaigns/${storefront}/${id}`);
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  }
}

onMounted(async () => {
  await campaignStore.fetchStorefronts();
  await campaignStore.fetchCampaign(storefront, id);
});
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="`/storefront-campaigns/${storefront}/${id}`">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Campaign</h1>
    </div>

    <div v-if="campaignStore.campaignLoading || campaignStore.storefrontLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="campaignStore.error" severity="error">
      {{ campaignStore.error }}
    </Message>

    <CampaignsCampaignForm
      v-else-if="campaignStore.campaign"
      :initial-values="initialValues"
      :storefronts="campaignStore.storefronts"
      :loading="campaignStore.saving"
      :server-error="serverError"
      submit-label="Update Campaign"
      storefront-disabled
      @submit="onSubmit"
    />
  </div>
</template>
