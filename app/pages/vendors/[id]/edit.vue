<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useVendorStore } from "~/stores/vendor";

const route = useRoute();
const id = route.params.id;
const vendorStore = useVendorStore();

const resolver = yupResolver(
  object({
    name: string()
      .required("Name is required")
      .min(2, "Min 2 characters")
      .max(255, "Max 255 characters"),
    business_name: string()
      .required("Business name is required")
      .min(2, "Min 2 characters")
      .max(255, "Max 255 characters"),
  }),
);

const initialValues = ref({
  name: "",
  business_name: "",
});

// --- Optional fields ---
const email = ref("");
const phone = ref("");
const code = ref("");
const addressLine1 = ref("");
const addressLine2 = ref("");
const city = ref("");
const state = ref("");
const postalCode = ref("");
const country = ref("");
const isActive = ref(true);

// --- UI state ---
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});

// --- Load vendor data ---
onMounted(async () => {
  try {
    await vendorStore.fetchVendor(id);
    const v = vendorStore.vendor;
    if (!v) {
      navigateTo("/vendors");
      return;
    }
    initialValues.value = {
      name: v.name || "",
      business_name: v.business_name || "",
    };
    email.value = v.email || "";
    phone.value = v.phone || "";
    code.value = v.code || "";
    addressLine1.value = v.address_line_1 || "";
    addressLine2.value = v.address_line_2 || "";
    city.value = v.city || "";
    state.value = v.state || "";
    postalCode.value = v.postal_code || "";
    country.value = v.country || "";
    isActive.value = v.is_active ?? true;
  } finally {
    pageLoading.value = false;
  }
});

// --- Form submission ---
async function onSubmit({ valid, values }) {
  if (!valid) return;

  validationErrors.value = {};
  loading.value = true;
  serverError.value = "";

  try {
    const payload = {
      name: values.name,
      business_name: values.business_name,
      is_active: isActive.value,
    };
    if (email.value) payload.email = email.value;
    if (phone.value) payload.phone = phone.value;
    if (code.value) payload.code = code.value;
    if (addressLine1.value) payload.address_line_1 = addressLine1.value;
    if (addressLine2.value) payload.address_line_2 = addressLine2.value;
    if (city.value) payload.city = city.value;
    if (state.value) payload.state = state.value;
    if (postalCode.value) payload.postal_code = postalCode.value;
    if (country.value) payload.country = country.value;

    await vendorStore.updateVendor(id, payload);
    navigateTo(`/vendors/${id}`);
  } catch (e) {
    if (e instanceof ApiError) {
      serverError.value = e.message;
      if (e.errors) validationErrors.value = e.errors;
    } else {
      serverError.value = "An unexpected error occurred";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="`/vendors/${id}`">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Vendor</h1>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Form
      v-else
      v-slot="$form"
      :initial-values="initialValues"
      :resolver="resolver"
      @submit="onSubmit"
    >
      <!-- Server error -->
      <Message
        v-if="serverError"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        {{ serverError }}
      </Message>

      <!-- Card 1: General Information -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">
          General Information
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div class="flex flex-col gap-1">
            <label for="name" class="text-sm font-medium text-slate-700"
              >Name *</label
            >
            <InputText
              id="name"
              name="name"
              placeholder="Contact name"
              fluid
            />
            <Message
              v-if="$form.name?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <!-- Business Name -->
          <div class="flex flex-col gap-1">
            <label
              for="business_name"
              class="text-sm font-medium text-slate-700"
              >Business Name *</label
            >
            <InputText
              id="business_name"
              name="business_name"
              placeholder="Business name"
              fluid
            />
            <Message
              v-if="$form.business_name?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.business_name.error?.message }}
            </Message>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Email</label>
            <InputText v-model="email" placeholder="vendor@example.com" fluid />
          </div>

          <!-- Phone -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Phone</label>
            <InputText v-model="phone" placeholder="+1234567890" fluid />
          </div>

          <!-- Code -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Code</label>
            <InputText v-model="code" placeholder="Vendor code" fluid />
          </div>

          <!-- Is Active -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Active</label>
            <ToggleSwitch v-model="isActive" />
          </div>
        </div>
      </div>

      <!-- Card 2: Address -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Address</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Address Line 1 -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Address Line 1</label
            >
            <InputText
              v-model="addressLine1"
              placeholder="Street address"
              fluid
            />
          </div>

          <!-- Address Line 2 -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Address Line 2</label
            >
            <InputText
              v-model="addressLine2"
              placeholder="Apt, suite, etc."
              fluid
            />
          </div>

          <!-- City -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">City</label>
            <InputText v-model="city" placeholder="City" fluid />
          </div>

          <!-- State -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">State</label>
            <InputText v-model="state" placeholder="State" fluid />
          </div>

          <!-- Postal Code -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Postal Code</label
            >
            <InputText
              v-model="postalCode"
              placeholder="Postal code"
              fluid
            />
          </div>

          <!-- Country -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Country</label>
            <InputText v-model="country" placeholder="Country" fluid />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end">
        <Button
          type="submit"
          label="Update Vendor"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>
