<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useShippingZoneStore } from "~/stores/shippingZone";

const route = useRoute();
const id = route.params.id;
const zoneStore = useShippingZoneStore();

const resolver = yupResolver(
  object({
    name: string().required("Name is required").min(2, "Min 2 characters").max(255, "Max 255 characters"),
    country: string().required("Country is required").min(2, "Min 2 characters").max(10, "Max 10 characters"),
  })
);

const initialValues = ref({ name: "", country: "" });
const state = ref("");
const city = ref("");
const postalCodePattern = ref("");
const isActive = ref(true);

const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");

onMounted(async () => {
  try {
    await zoneStore.fetchZone(id);
    const z = zoneStore.zone;
    if (!z) { navigateTo("/shipping/zones"); return; }
    initialValues.value = { name: z.name || "", country: z.country || "" };
    state.value = z.state || "";
    city.value = z.city || "";
    postalCodePattern.value = z.postal_code_pattern || "";
    isActive.value = z.is_active ?? true;
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
      name: values.name,
      country: values.country,
      state: state.value || null,
      city: city.value || null,
      postal_code_pattern: postalCodePattern.value || null,
      is_active: isActive.value,
    };
    await zoneStore.updateZone(id, payload);
    navigateTo("/shipping/zones");
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
      <NuxtLink to="/shipping/zones">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Shipping Zone</h1>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Form v-else v-slot="$form" :initial-values="initialValues" :resolver="resolver" @submit="onSubmit">
      <Message v-if="serverError" severity="error" :closable="false" class="mb-4">{{ serverError }}</Message>

      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Zone Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div class="flex flex-col gap-1">
            <label for="name" class="text-sm font-medium text-slate-700">Name *</label>
            <InputText id="name" name="name" placeholder="e.g. Lagos" fluid />
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="country" class="text-sm font-medium text-slate-700">Country Code *</label>
            <InputText id="country" name="country" placeholder="e.g. NG" fluid />
            <Message v-if="$form.country?.invalid" severity="error" size="small" variant="simple">
              {{ $form.country.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">State</label>
            <InputText v-model="state" placeholder="e.g. Lagos" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">City</label>
            <InputText v-model="city" placeholder="e.g. Lagos Island" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Postal Code Pattern</label>
            <InputText v-model="postalCodePattern" placeholder="e.g. 1000*" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Active</label>
            <ToggleSwitch v-model="isActive" />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" label="Save Changes" icon="pi pi-check" :loading="loading" />
      </div>
    </Form>
  </div>
</template>
