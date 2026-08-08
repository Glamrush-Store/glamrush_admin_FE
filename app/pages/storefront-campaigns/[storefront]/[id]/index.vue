<script setup>
import { useToast } from "primevue/usetoast";
import { useStorefrontCampaignStore } from "~/stores/storefrontCampaign";

const route = useRoute();
const toast = useToast();
const campaignStore = useStorefrontCampaignStore();
const storefront = route.params.storefront;
const id = route.params.id;

const campaign = computed(() => campaignStore.campaign);

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function imageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.url || value.medium || "";
}

async function toggleCampaign() {
  if (!campaign.value) return;
  try {
    if (campaign.value.is_active) {
      await campaignStore.disableCampaign(storefront, id);
      toast.add({ severity: "success", summary: "Campaign disabled", life: 3000 });
    } else {
      await campaignStore.enableCampaign(storefront, id);
      toast.add({ severity: "success", summary: "Campaign enabled", life: 3000 });
    }
    await campaignStore.fetchCampaign(storefront, id);
  } catch (e) {
    toast.add({ severity: "error", summary: "Status update failed", detail: e.message, life: 4000 });
  }
}

onMounted(() => {
  campaignStore.fetchCampaign(storefront, id);
});
</script>

<template>
  <div>
    <Toast />

    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/storefront-campaigns">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ campaign?.internal_name || "Campaign Detail" }}
        </h1>
      </div>

      <div v-if="campaign" class="flex items-center gap-2">
        <Button
          :label="campaign.is_active ? 'Disable' : 'Enable'"
          :icon="campaign.is_active ? 'pi pi-pause' : 'pi pi-play'"
          :severity="campaign.is_active ? 'warning' : 'success'"
          @click="toggleCampaign"
        />
        <NuxtLink :to="`/storefront-campaigns/${storefront}/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
      </div>
    </div>

    <div v-if="campaignStore.campaignLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="campaignStore.error" severity="error">
      {{ campaignStore.error }}
    </Message>

    <div v-else-if="campaign" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-3">Desktop Image</h2>
          <img
            v-if="imageUrl(campaign.desktop_image)"
            :src="imageUrl(campaign.desktop_image)"
            :alt="campaign.title"
            class="w-full rounded object-cover"
          />
          <div v-else class="flex items-center justify-center h-48 bg-slate-100 rounded text-slate-400">
            <i class="pi pi-desktop text-4xl" />
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-3">Mobile Image</h2>
          <img
            v-if="imageUrl(campaign.mobile_image)"
            :src="imageUrl(campaign.mobile_image)"
            :alt="campaign.title"
            class="w-full rounded object-cover"
          />
          <div v-else class="flex items-center justify-center h-48 bg-slate-100 rounded text-slate-400">
            <i class="pi pi-mobile text-4xl" />
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 grid grid-cols-1 gap-6">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Campaign Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <span class="text-sm text-slate-500">Title</span>
              <p class="font-medium text-slate-900">{{ campaign.title }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Storefront</span>
              <p class="font-medium text-slate-900">{{ campaign.storefront_slug }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Eyebrow</span>
              <p class="font-medium text-slate-900">{{ campaign.eyebrow || "-" }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Priority</span>
              <p class="font-medium text-slate-900">{{ campaign.priority }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Status</span>
              <p>
                <Tag :value="campaign.is_active ? 'Active' : 'Inactive'" :severity="campaign.is_active ? 'success' : 'danger'" />
              </p>
            </div>
            <div>
              <span class="text-sm text-slate-500">CTA</span>
              <p class="font-medium text-slate-900">{{ campaign.cta_label || "-" }}</p>
              <p class="text-sm text-slate-500 m-0">{{ campaign.cta_url || "-" }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Description</h2>
          <p class="font-medium text-slate-900 whitespace-pre-wrap">{{ campaign.description || "-" }}</p>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Schedule</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <span class="text-sm text-slate-500">Starts At</span>
              <p class="font-medium text-slate-900">{{ formatDate(campaign.starts_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Ends At</span>
              <p class="font-medium text-slate-900">{{ formatDate(campaign.ends_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Created At</span>
              <p class="font-medium text-slate-900">{{ formatDate(campaign.created_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Updated At</span>
              <p class="font-medium text-slate-900">{{ formatDate(campaign.updated_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
