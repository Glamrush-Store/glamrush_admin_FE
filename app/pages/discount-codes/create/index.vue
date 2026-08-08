<script setup>
import { ApiError } from "~/composables/apiClient";
import { useDiscountCodeStore } from "~/stores/discountCode";

const discountStore = useDiscountCodeStore();
const serverError = ref("");

const initialValues = computed(() => ({
  code: "",
  name: "",
  description: "",
  type: "percentage",
  value: null,
  currency: null,
  maximum_discount_amount: null,
  minimum_subtotal: null,
  starts_at: null,
  ends_at: null,
  is_active: true,
  total_usage_limit: null,
  per_customer_usage_limit: null,
  first_order_only: false,
  applies_to_sale_items: true,
  applies_to_all_storefronts: true,
  storefronts: [],
  targets: [],
}));

async function onSubmit(payload) {
  serverError.value = "";
  try {
    const response = await discountStore.createDiscountCode(payload);
    await navigateTo(`/discount-codes/${response.data.id}`);
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  }
}

onMounted(() => {
  discountStore.fetchStorefronts();
});
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/discount-codes">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Create Discount Code</h1>
    </div>

    <div v-if="discountStore.storefrontLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <DiscountCodesDiscountCodeForm
      v-else
      :initial-values="initialValues"
      :storefronts="discountStore.storefronts"
      :loading="discountStore.saving"
      :server-error="serverError"
      submit-label="Create Discount Code"
      @submit="onSubmit"
    />
  </div>
</template>
