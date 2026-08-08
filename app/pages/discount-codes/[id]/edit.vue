<script setup>
import { ApiError } from "~/composables/apiClient";
import { useDiscountCodeStore } from "~/stores/discountCode";

const route = useRoute();
const discountStore = useDiscountCodeStore();
const id = route.params.id;
const serverError = ref("");

const initialValues = computed(() => discountStore.discountCode || {});

async function onSubmit(payload) {
  serverError.value = "";
  try {
    await discountStore.updateDiscountCode(id, payload);
    await navigateTo(`/discount-codes/${id}`);
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  }
}

onMounted(async () => {
  await discountStore.fetchStorefronts();
  await discountStore.fetchDiscountCode(id);
});
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="`/discount-codes/${id}`">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Discount Code</h1>
    </div>

    <div v-if="discountStore.detailLoading || discountStore.storefrontLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="discountStore.detailError" severity="error">
      {{ discountStore.detailError }}
    </Message>

    <DiscountCodesDiscountCodeForm
      v-else-if="discountStore.discountCode"
      :initial-values="initialValues"
      :storefronts="discountStore.storefronts"
      :loading="discountStore.saving"
      :server-error="serverError"
      submit-label="Update Discount Code"
      @submit="onSubmit"
    />
  </div>
</template>
