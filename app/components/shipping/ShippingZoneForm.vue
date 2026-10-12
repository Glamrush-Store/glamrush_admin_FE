<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import {
  buildCityGroups,
  buildZonePayload,
  cityKey,
  cityLabel,
  coverageSummary,
  locationCode,
  selectedCities,
  selectedStateValues,
  stateLabel,
  uniqueCities,
} from "~/constants/shippingZones";
import { useShippingZoneStore } from "~/stores/shippingZone";

const props = defineProps({
  mode: { type: String, default: "create" },
  zone: { type: Object, default: null },
  submitLabel: { type: String, default: "Save Zone" },
});

const emit = defineEmits(["submit-success"]);

const zoneStore = useShippingZoneStore();
const toast = useToast();

const resolver = yupResolver(
  object({
    name: string().required("Name is required").min(2, "Min 2 characters").max(255, "Max 255 characters"),
    country: string().required("Country is required").min(2, "Min 2 characters").max(10, "Max 10 characters"),
  })
);

const formKey = ref(0);
const formInitialValues = ref({ name: "", country: "" });
const selectedStates = ref([]);
const selectedCityKeys = ref([]);
const selectedCityMap = ref({});
const cityStateFilter = ref(null);
const postalCodePattern = ref("");
const isActive = ref(true);
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});
const hydrated = ref(false);

const locationsReady = computed(() => Boolean(zoneStore.countryLocations) && !zoneStore.locationsLoading);
const countryOptions = computed(() => zoneStore.countries || []);
const stateOptions = computed(() => zoneStore.countryLocations?.states || []);
const cityGroups = computed(() => buildCityGroups(zoneStore.countryLocations?.cities || [], cityStateFilter.value));
const selectedCityObjects = computed(() => selectedCityKeys.value.map((key) => selectedCityMap.value[key]).filter(Boolean));
const redundantCities = computed(() => selectedCityObjects.value.filter((city) => selectedStates.value.includes(city.state)));
const payloadCities = computed(() => uniqueCities(selectedCityObjects.value).filter((city) => !selectedStates.value.includes(city.state)));
const selectedCountryLabel = computed(() => {
  const country = countryOptions.value.find((option) => locationCode(option) === formInitialValues.value.country);
  return country?.label || props.zone?.country_name || props.zone?.country || "";
});
const summaryText = computed(() => coverageSummary({
  countryLabel: selectedCountryLabel.value,
  states: selectedStates.value,
  cities: selectedCityObjects.value,
  locations: zoneStore.countryLocations,
}));
const submitDisabled = computed(() => loading.value || zoneStore.countriesLoading || zoneStore.locationsLoading);

function resetServerErrors() {
  serverError.value = "";
  validationErrors.value = {};
}

function fieldError(field) {
  const direct = validationErrors.value[field];
  if (Array.isArray(direct)) return direct[0];
  if (direct) return direct;

  const nested = Object.entries(validationErrors.value).find(([key]) => key === field || key.startsWith(`${field}.`));
  const value = nested?.[1];
  return Array.isArray(value) ? value[0] : value || "";
}

function setSelectedCities(cities) {
  const nextMap = {};
  const nextKeys = [];

  uniqueCities(cities).forEach((city) => {
    const key = cityKey(city);
    nextMap[key] = city;
    nextKeys.push(key);
  });

  selectedCityMap.value = nextMap;
  selectedCityKeys.value = nextKeys;
}

function onCitySelection(keys) {
  const nextMap = { ...selectedCityMap.value };
  (zoneStore.countryLocations?.cities || []).forEach((option) => {
    const key = cityKey({ state: option.state_value, city: option.value });
    if (keys.includes(key)) nextMap[key] = { state: option.state_value, city: option.value };
  });

  selectedCityMap.value = nextMap;
  selectedCityKeys.value = keys;
}

function removeCity(key) {
  selectedCityKeys.value = selectedCityKeys.value.filter((item) => item !== key);
}

function removeState(value) {
  selectedStates.value = selectedStates.value.filter((item) => item !== value);
}

async function loadCountryLocations(countryCode, clearSelections = true) {
  if (clearSelections) {
    selectedStates.value = [];
    setSelectedCities([]);
    cityStateFilter.value = null;
  }

  if (!countryCode) {
    zoneStore.clearCountryLocations();
    return;
  }

  try {
    await zoneStore.fetchCountryLocations(countryCode);
  } catch (error) {
    serverError.value = error instanceof ApiError ? error.message : "Unable to load states and cities";
  }
}

async function onCountryChange(countryCode) {
  formInitialValues.value = { ...formInitialValues.value, country: countryCode || "" };
  resetServerErrors();
  await loadCountryLocations(countryCode, true);
}

async function hydrateFromZone(zone) {
  if (!zone || hydrated.value) return;

  formInitialValues.value = {
    name: zone.name || "",
    country: zone.country || "",
  };
  postalCodePattern.value = zone.postal_code_pattern || "";
  isActive.value = zone.is_active ?? true;

  if (zone.country) {
    await loadCountryLocations(zone.country, false);
  }

  selectedStates.value = selectedStateValues(zone);
  setSelectedCities(selectedCities(zone));
  formKey.value += 1;
  hydrated.value = true;
}

async function initializeForm() {
  try {
    await zoneStore.fetchCountries();
    if (props.zone) {
      await hydrateFromZone(props.zone);
    }
  } catch (error) {
    serverError.value = error instanceof ApiError ? error.message : "Unable to load shipping zone form data";
  }
}

async function onSubmit({ valid, values }) {
  if (!valid || submitDisabled.value) return;

  loading.value = true;
  resetServerErrors();

  try {
    const payload = buildZonePayload(values, selectedStates.value, selectedCityObjects.value, isActive.value, postalCodePattern.value);
    const response = props.mode === "edit"
      ? await zoneStore.updateZone(props.zone.id, payload)
      : await zoneStore.createZone(payload);

    await zoneStore.fetchZones();

    toast.add({
      severity: "success",
      summary: props.mode === "edit" ? "Zone updated" : "Zone created",
      detail: response.message || "Shipping zone saved successfully.",
      life: 3500,
    });

    emit("submit-success", response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        validationErrors.value = error.errors || {};
        serverError.value = error.message || "Please correct the highlighted fields.";
      } else if (error.status === 409) {
        serverError.value = error.message || "This location is already assigned to another shipping zone.";
      } else {
        serverError.value = error.message || "An unexpected error occurred";
      }
    } else {
      serverError.value = "An unexpected error occurred";
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.zone,
  (zone) => {
    if (zone) hydrateFromZone(zone);
  },
  { immediate: false }
);

onMounted(initializeForm);
</script>

<template>
  <Form
    :key="formKey"
    v-slot="$form"
    :initial-values="formInitialValues"
    :resolver="resolver"
    @submit="onSubmit"
  >
    <Message v-if="serverError" severity="error" :closable="false" class="mb-4">
      {{ serverError }}
    </Message>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-slate-800">Zone Details</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label for="name" class="text-sm font-medium text-slate-700">Name *</label>
          <InputText id="name" name="name" placeholder="e.g. Selected South West areas" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="country" class="text-sm font-medium text-slate-700">Country *</label>
          <Select
            id="country"
            name="country"
            :options="countryOptions"
            option-label="label"
            option-value="value"
            placeholder="Select country"
            :loading="zoneStore.countriesLoading"
            :disabled="zoneStore.countriesLoading"
            filter
            fluid
            @update:model-value="onCountryChange"
          />
          <Message v-if="$form.country?.invalid || fieldError('country')" severity="error" size="small" variant="simple">
            {{ $form.country?.error?.message || fieldError("country") }}
          </Message>
        </div>

        <div class="flex flex-col gap-1 md:col-span-2">
          <label class="text-sm font-medium text-slate-700">States covered</label>
          <MultiSelect
            v-model="selectedStates"
            :options="stateOptions"
            option-label="label"
            option-value="value"
            display="chip"
            placeholder="Select one or more states"
            :loading="zoneStore.locationsLoading"
            :disabled="!$form.country?.value || !locationsReady"
            :empty-message="zoneStore.countryLocations ? 'No states available' : 'Select a country first'"
            filter
            fluid
          />
          <Message v-if="fieldError('states')" severity="error" size="small" variant="simple">
            {{ fieldError("states") }}
          </Message>
          <div v-if="selectedStates.length" class="mt-1 flex flex-wrap gap-2">
            <Chip
              v-for="stateValue in selectedStates"
              :key="stateValue"
              :label="stateLabel(stateValue, zoneStore.countryLocations)"
              removable
              @remove="removeState(stateValue)"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Filter cities by state</label>
          <Select
            v-model="cityStateFilter"
            :options="stateOptions"
            option-label="label"
            option-value="value"
            placeholder="All states"
            :disabled="!locationsReady"
            show-clear
            filter
            fluid
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Specific cities covered</label>
          <MultiSelect
            :model-value="selectedCityKeys"
            :options="cityGroups"
            option-group-label="label"
            option-group-children="items"
            option-label="label"
            option-value="key"
            display="chip"
            placeholder="Select one or more cities"
            :loading="zoneStore.locationsLoading"
            :disabled="!$form.country?.value || !locationsReady"
            :empty-message="zoneStore.countryLocations ? 'No cities available' : 'Select a country first'"
            filter
            fluid
            @update:model-value="onCitySelection"
          />
          <Message v-if="fieldError('cities')" severity="error" size="small" variant="simple">
            {{ fieldError("cities") }}
          </Message>
        </div>

        <div v-if="selectedCityKeys.length" class="flex flex-col gap-1 md:col-span-2">
          <span class="text-sm font-medium text-slate-700">Selected cities</span>
          <div class="flex flex-wrap gap-2">
            <Chip
              v-for="key in selectedCityKeys"
              :key="key"
              :label="cityLabel(selectedCityMap[key], zoneStore.countryLocations)"
              removable
              @remove="removeCity(key)"
            />
          </div>
        </div>

        <Message
          v-if="redundantCities.length"
          severity="warn"
          :closable="false"
          class="md:col-span-2"
        >
          {{ redundantCities.length }} selected {{ redundantCities.length === 1 ? "city is" : "cities are" }} already covered by selected state-wide coverage and will be omitted from the submitted payload.
        </Message>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Postal Code Pattern</label>
          <InputText v-model="postalCodePattern" placeholder="e.g. 1000*" fluid />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-700">Active</label>
          <ToggleSwitch v-model="isActive" />
        </div>
      </div>
    </div>

    <div class="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="m-0 text-sm font-semibold text-slate-800">Coverage summary</p>
          <p class="mb-0 mt-1 text-sm text-slate-600">{{ summaryText }}</p>
        </div>
        <Tag
          :value="payloadCities.length || selectedStates.length ? 'Partial coverage' : 'Country-wide'"
          :severity="payloadCities.length || selectedStates.length ? 'info' : 'success'"
        />
      </div>
    </div>

    <Message v-if="zoneStore.locationError" severity="error" :closable="false" class="mb-4">
      {{ zoneStore.locationError }}
    </Message>

    <div class="flex justify-end">
      <Button
        type="submit"
        :label="submitLabel"
        icon="pi pi-check"
        :loading="loading"
        :disabled="submitDisabled"
      />
    </div>
  </Form>
</template>

