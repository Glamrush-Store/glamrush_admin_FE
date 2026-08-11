<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useShippingZoneStore } from "~/stores/shippingZone";

const zoneStore = useShippingZoneStore();

const resolver = yupResolver(
  object({
    name: string().required("Name is required").min(2, "Min 2 characters").max(255, "Max 255 characters"),
    country: string().required("Country is required").min(2, "Min 2 characters").max(10, "Max 10 characters"),
  })
);

const initialValues = { name: "", country: "" };

const state = ref("");
const city = ref("");
const postalCodePattern = ref("");
const isActive = ref(true);

const loading = ref(false);
const serverError = ref("");

const stateOptions = computed(() => zoneStore.countryLocations?.states || []);
const cityOptions = computed(() => {
  const cities = zoneStore.countryLocations?.cities || [];
  if (!state.value) return cities;
  return cities.filter((option) => option.state_value === state.value);
});

async function onCountryChange(countryCode) {
  state.value = "";
  city.value = "";

  if (!countryCode) {
    zoneStore.clearCountryLocations();
    return;
  }

  try {
    await zoneStore.fetchCountryLocations(countryCode);
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "Unable to load states and cities";
  }
}

function onStateChange(value) {
  state.value = value || "";
  city.value = "";
}

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    const payload = {
      name: values.name,
      country: values.country,
      is_active: isActive.value,
    };
    if (state.value) payload.state = state.value;
    if (city.value) payload.city = city.value;
    if (postalCodePattern.value) payload.postal_code_pattern = postalCodePattern.value;

    const response = await zoneStore.createZone(payload);
    navigateTo(`/shipping/zones/${response.data.id}/edit`);
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await zoneStore.fetchCountries();
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "Unable to load countries";
  }
});
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/shipping/zones">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Create Shipping Zone</h1>
    </div>

    <Form v-slot="$form" :initial-values="initialValues" :resolver="resolver" @submit="onSubmit">
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
            <label for="country" class="text-sm font-medium text-slate-700">Country *</label>
            <Select
              id="country"
              name="country"
              :options="zoneStore.countries"
              option-label="label"
              option-value="value"
              placeholder="Select country"
              :loading="zoneStore.countriesLoading"
              :disabled="zoneStore.countriesLoading"
              filter
              fluid
              @update:model-value="onCountryChange"
            />
            <Message v-if="$form.country?.invalid" severity="error" size="small" variant="simple">
              {{ $form.country.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">State</label>
            <Select
              :model-value="state"
              :options="stateOptions"
              option-label="label"
              option-value="value"
              placeholder="Select state"
              :loading="zoneStore.locationsLoading"
              :disabled="!$form.country?.value || zoneStore.locationsLoading"
              :empty-message="zoneStore.countryLocations ? 'No states available' : 'Select a country first'"
              show-clear
              filter
              fluid
              @update:model-value="onStateChange"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">City</label>
            <Select
              v-model="city"
              :options="cityOptions"
              option-label="label"
              option-value="value"
              placeholder="Select city"
              :loading="zoneStore.locationsLoading"
              :disabled="!$form.country?.value || zoneStore.locationsLoading"
              :empty-message="zoneStore.countryLocations ? 'No cities available' : 'Select a country first'"
              show-clear
              filter
              fluid
            />
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
        <Button type="submit" label="Create Zone" icon="pi pi-check" :loading="loading" />
      </div>
    </Form>
  </div>
</template>
