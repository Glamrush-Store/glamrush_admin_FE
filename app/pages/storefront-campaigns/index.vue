<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useStorefrontCampaignStore } from "~/stores/storefrontCampaign";

const campaignStore = useStorefrontCampaignStore();
const confirm = useConfirm();
const toast = useToast();

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function imageUrl(campaign) {
  return campaign.desktop_image || campaign.mobile_image || "";
}

function onPageChange(event) {
  campaignStore.setPage(event.page + 1);
}

async function onStorefrontChange(value) {
  await campaignStore.setStorefront(value);
}

async function refreshCampaigns() {
  await campaignStore.fetchCampaigns();
}

async function toggleCampaign(campaign) {
  try {
    if (campaign.is_active) {
      await campaignStore.disableCampaign(campaign.storefront_slug, campaign.id);
      toast.add({ severity: "success", summary: "Campaign disabled", life: 3000 });
    } else {
      await campaignStore.enableCampaign(campaign.storefront_slug, campaign.id);
      toast.add({ severity: "success", summary: "Campaign enabled", life: 3000 });
    }
    await refreshCampaigns();
  } catch (e) {
    toast.add({ severity: "error", summary: "Status update failed", detail: e.message, life: 4000 });
  }
}

function confirmDelete(campaign) {
  confirm.require({
    message: `Delete ${campaign.internal_name}?`,
    header: "Delete Campaign",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Delete",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await campaignStore.deleteCampaign(campaign.storefront_slug, campaign.id);
        toast.add({ severity: "success", summary: "Campaign deleted", life: 3000 });
        await refreshCampaigns();
      } catch (e) {
        toast.add({ severity: "error", summary: "Delete failed", detail: e.message, life: 4000 });
      }
    },
  });
}

onMounted(async () => {
  await campaignStore.fetchStorefronts();
  await campaignStore.fetchCampaigns();
});
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Storefront Campaigns</h1>
      <NuxtLink :to="`/storefront-campaigns/create?storefront=${campaignStore.selectedStorefront}`">
        <Button label="Add Campaign" icon="pi pi-plus" :disabled="!campaignStore.selectedStorefront" />
      </NuxtLink>
    </div>

    <Message v-if="campaignStore.error" severity="error" class="mb-4">
      {{ campaignStore.error }}
    </Message>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Storefront</label>
        <Select
          :model-value="campaignStore.selectedStorefront"
          :options="campaignStore.storefronts"
          option-label="name"
          option-value="slug"
          placeholder="Select storefront"
          class="w-64"
          :loading="campaignStore.storefrontLoading"
          @update:model-value="onStorefrontChange"
        />
      </div>

      <Button
        label="Refresh"
        icon="pi pi-refresh"
        severity="secondary"
        text
        :loading="campaignStore.loading"
        @click="refreshCampaigns"
      />
    </div>

    <DataTable
      :value="campaignStore.campaigns"
      :loading="campaignStore.loading"
      lazy
      :total-records="campaignStore.pagination.total"
      striped-rows
      class="mb-4"
    >
      <Column header="Image" class="w-24">
        <template #body="{ data }">
          <img
            v-if="imageUrl(data)"
            :src="imageUrl(data)"
            :alt="data.title"
            class="w-16 h-12 object-cover rounded border border-slate-200"
          />
          <div v-else class="w-16 h-12 flex items-center justify-center rounded bg-slate-100 text-slate-400">
            <i class="pi pi-image" />
          </div>
        </template>
      </Column>
      <Column header="Campaign">
        <template #body="{ data }">
          <div>
            <p class="font-medium text-slate-900 m-0">{{ data.title }}</p>
            <p class="text-sm text-slate-500 m-0">{{ data.internal_name }}</p>
          </div>
        </template>
      </Column>
      <Column field="storefront_slug" header="Storefront" />
      <Column field="priority" header="Priority" />
      <Column field="is_active" header="Status">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Schedule">
        <template #body="{ data }">
          <div class="text-sm">
            <p class="m-0">Start: {{ formatDate(data.starts_at) }}</p>
            <p class="m-0 text-slate-500">End: {{ formatDate(data.ends_at) }}</p>
          </div>
        </template>
      </Column>
      <Column field="updated_at" header="Updated">
        <template #body="{ data }">{{ formatDate(data.updated_at) }}</template>
      </Column>
      <Column header="Actions" class="w-44">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <NuxtLink :to="`/storefront-campaigns/${data.storefront_slug}/${data.id}`">
              <Button icon="pi pi-eye" severity="info" text rounded />
            </NuxtLink>
            <Button
              :icon="data.is_active ? 'pi pi-pause' : 'pi pi-play'"
              :severity="data.is_active ? 'warning' : 'success'"
              text
              rounded
              @click="toggleCampaign(data)"
            />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="campaignStore.pagination.per_page"
      :total-records="campaignStore.pagination.total"
      :first="(campaignStore.pagination.current_page - 1) * campaignStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
