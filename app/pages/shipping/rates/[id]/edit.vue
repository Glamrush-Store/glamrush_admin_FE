<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string, number } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useShippingRateStore } from "~/stores/shippingRate";
import { SHIPPING_ZONES, SHIPPING_METHODS } from "~/constants/endpoints";

const route = useRoute();
const id = route.params.id;
const rateStore = useShippingRateStore();

const resolver = yupResolver(
  object({
    shipping_zone_id: string().required("Zone is required"),
    shipping_method_id: string().required("Method is required"),
    rate_type: string().required("Rate type is required"),
    amount: number().typeError("Amount must be a number").required("Amount is required").min(0, "Must be 0 or more"),
  })
);

const initialValues = ref({ shipping_zone_id: "", shipping_method_id: "", rate_type: "", amount: 0 });

const freeOverAmount = ref(null);
const minOrderAmount = ref(null);
const maxOrderAmount = ref(null);
const estimatedDaysMin = ref(null);
const estimatedDaysMax = ref(null);
const isActive = ref(true);

const zoneOptions = ref([]);
const methodOptions = ref([]);
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");

const rateTypeOptions = [
  { label: "Flat", value: "flat" },
  { label: "Order Total", value: "order_total" },
  { label: "Weight", value: "weight" },
];

onMounted(async () => {
  try {
    const api = useApiClient();
    const [rateRes, zonesRes, methodsRes] = await Promise.all([
      rateStore.fetchRate(id),
      api.get(`${SHIPPING_ZONES.LIST}?per_page=100`),
      api.get(`${SHIPPING_METHODS.LIST}?per_page=100`),
    ]);
    zoneOptions.value = zonesRes.data;
    methodOptions.value = methodsRes.data;

    const r = rateStore.rate;
    if (!r) { navigateTo("/shipping/rates"); return; }

    initialValues.value = {
      shipping_zone_id: r.zone?.id || "",
      shipping_method_id: r.method?.id || "",
      rate_type: r.rate_type || "",
      amount: parseFloat(r.amount) || 0,
    };
    freeOverAmount.value = r.free_over_amount ? parseFloat(r.free_over_amount) : null;
    minOrderAmount.value = r.min_order_amount ? parseFloat(r.min_order_amount) : null;
    maxOrderAmount.value = r.max_order_amount ? parseFloat(r.max_order_amount) : null;
    estimatedDaysMin.value = r.estimated_days_min ?? null;
    estimatedDaysMax.value = r.estimated_days_max ?? null;
    isActive.value = r.is_active ?? true;
  } finally {
    pageLoading.value = false;
  }
});

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    const payload = {
      shipping_zone_id: values.shipping_zone_id,
      shipping_method_id: values.shipping_method_id,
      rate_type: values.rate_type,
      amount: values.amount,
      free_over_amount: freeOverAmount.value ?? null,
      min_order_amount: minOrderAmount.value ?? null,
      max_order_amount: maxOrderAmount.value ?? null,
      estimated_days_min: estimatedDaysMin.value ?? null,
      estimated_days_max: estimatedDaysMax.value ?? null,
      is_active: isActive.value,
    };
    await rateStore.updateRate(id, payload);
    navigateTo("/shipping/rates");
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/shipping/rates">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Shipping Rate</h1>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Form v-else v-slot="$form" :initial-values="initialValues" :resolver="resolver" @submit="onSubmit">
      <Message v-if="serverError" severity="error" :closable="false" class="mb-4">{{ serverError }}</Message>

      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Rate Configuration</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div class="flex flex-col gap-1">
            <label for="shipping_zone_id" class="text-sm font-medium text-slate-700">Zone *</label>
            <Select
              id="shipping_zone_id"
              name="shipping_zone_id"
              :options="zoneOptions"
              option-label="name"
              option-value="id"
              placeholder="Select a zone"
              fluid
            />
            <Message v-if="$form.shipping_zone_id?.invalid" severity="error" size="small" variant="simple">
              {{ $form.shipping_zone_id.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="shipping_method_id" class="text-sm font-medium text-slate-700">Method *</label>
            <Select
              id="shipping_method_id"
              name="shipping_method_id"
              :options="methodOptions"
              option-label="name"
              option-value="id"
              placeholder="Select a method"
              fluid
            />
            <Message v-if="$form.shipping_method_id?.invalid" severity="error" size="small" variant="simple">
              {{ $form.shipping_method_id.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="rate_type" class="text-sm font-medium text-slate-700">Rate Type *</label>
            <Select
              id="rate_type"
              name="rate_type"
              :options="rateTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Select type"
              fluid
            />
            <Message v-if="$form.rate_type?.invalid" severity="error" size="small" variant="simple">
              {{ $form.rate_type.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="amount" class="text-sm font-medium text-slate-700">Amount *</label>
            <InputNumber id="amount" name="amount" :min="0" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
            <Message v-if="$form.amount?.invalid" severity="error" size="small" variant="simple">
              {{ $form.amount.error?.message }}
            </Message>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Optional Settings</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Free Over Amount</label>
            <InputNumber v-model="freeOverAmount" :min="0" :min-fraction-digits="2" :max-fraction-digits="2" placeholder="Leave blank to disable" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Min Order Amount</label>
            <InputNumber v-model="minOrderAmount" :min="0" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Max Order Amount</label>
            <InputNumber v-model="maxOrderAmount" :min="0" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Active</label>
            <ToggleSwitch v-model="isActive" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Est. Min Days</label>
            <InputNumber v-model="estimatedDaysMin" :min="0" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Est. Max Days</label>
            <InputNumber v-model="estimatedDaysMax" :min="0" fluid />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" label="Save Changes" icon="pi pi-check" :loading="loading" />
      </div>
    </Form>
  </div>
</template>
