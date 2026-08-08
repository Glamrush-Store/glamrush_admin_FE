<script setup>
import { ApiError } from "~/composables/apiClient";
import { useStorefrontCampaignStore } from "~/stores/storefrontCampaign";

const route = useRoute();
const campaignStore = useStorefrontCampaignStore();
const serverError = ref("");

const initialValues = computed(() => ({
  storefront_slug: route.query.storefront || campaignStore.selectedStorefront,
  internal_name: "",
  eyebrow: "",
  title: "",
  description: "",
  cta_label: "",
  cta_url: "",
  priority: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
}));

async function onSubmit({ storefront, formData }) {
  serverError.value = "";
  try {
    const response = await campaignStore.createCampaign(storefront, formData);
    navigateTo(`/storefront-campaigns/${storefront}/${response.data.id}`);
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  }
}

onMounted(async () => {
  await campaignStore.fetchStorefronts();
  if (route.query.storefront) campaignStore.selectedStorefront = route.query.storefront;
});
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/storefront-campaigns">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Create Campaign</h1>
    </div>

    <div v-if="campaignStore.storefrontLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <CampaignsCampaignForm
      v-else
      :initial-values="initialValues"
      :storefronts="campaignStore.storefronts"
      :loading="campaignStore.saving"
      :server-error="serverError"
      submit-label="Create Campaign"
      @submit="onSubmit"
    />
  </div>
</template>
