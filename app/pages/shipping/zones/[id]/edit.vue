<script setup>
import { ApiError } from "~/composables/apiClient";
import ShippingZoneForm from "~/components/shipping/ShippingZoneForm.vue";
import { useShippingZoneStore } from "~/stores/shippingZone";

const route = useRoute();
const id = route.params.id;
const zoneStore = useShippingZoneStore();

const pageLoading = ref(true);
const serverError = ref("");

async function loadZone() {
  pageLoading.value = true;
  serverError.value = "";

  try {
    await zoneStore.fetchZone(id);
    if (!zoneStore.zone) {
      navigateTo("/shipping/zones");
    }
  } catch (error) {
    serverError.value = error instanceof ApiError ? error.message : "Unable to load shipping zone";
  } finally {
    pageLoading.value = false;
  }
}

function onUpdated() {
  navigateTo("/shipping/zones");
}

onMounted(loadZone);
</script>

<template>
  <div>
    <Toast />

    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/shipping/zones">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Edit Shipping Zone</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500">
          Update zone coverage without changing its shipping rates.
        </p>
      </div>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="serverError" severity="error" :closable="false" class="mb-4">
      {{ serverError }}
    </Message>

    <ShippingZoneForm
      v-else
      mode="edit"
      :zone="zoneStore.zone"
      submit-label="Save Changes"
      @submit-success="onUpdated"
    />
  </div>
</template>

