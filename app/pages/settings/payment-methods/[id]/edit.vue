<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { usePaymentMethodStore } from "~/stores/paymentMethod";

const route = useRoute();
const id = route.params.id;
const store = usePaymentMethodStore();
const toast = useToast();

const channelOptions = ["card", "bank", "ussd", "transfer", "bank_transfer", "qr", "mobile_money"];

const resolver = yupResolver(
  object({
    name: string().required("Name is required").min(2, "Min 2 characters").max(255, "Max 255 characters"),
    code: string().required("Code is required").min(2, "Min 2 characters").max(100, "Max 100 characters"),
  })
);

const initialValues = ref({ name: "", code: "" });
const description = ref("");
const selectedChannels = ref([]);
const isActive = ref(true);
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");

onMounted(async () => {
  try {
    await store.fetchPaymentMethod(id);
    const m = store.method;
    if (!m) { navigateTo("/settings/payment-methods"); return; }
    initialValues.value = { name: m.name || "", code: m.code || "" };
    description.value = m.description || "";
    selectedChannels.value = m.public_config?.channels ?? [];
    isActive.value = m.is_active ?? true;
  } finally {
    pageLoading.value = false;
  }
});

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    await store.updatePaymentMethod(id, {
      name: values.name,
      code: values.code,
      description: description.value || null,
      is_active: isActive.value,
      public_config: { channels: selectedChannels.value },
    });
    toast.add({ severity: "success", summary: "Saved", detail: "Payment method updated", life: 3000 });
  } catch (e) {
    serverError.value = e instanceof ApiError ? e.message : "An unexpected error occurred";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <Toast />

    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/settings/payment-methods">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Payment Method</h1>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Form v-else v-slot="$form" :initial-values="initialValues" :resolver="resolver" @submit="onSubmit">
      <Message v-if="serverError" severity="error" :closable="false" class="mb-4">{{ serverError }}</Message>

      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Payment Method Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div class="flex flex-col gap-1">
            <label for="pm-name" class="text-sm font-medium text-slate-700">Name *</label>
            <InputText id="pm-name" name="name" placeholder="e.g. Paystack" fluid />
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="pm-code" class="text-sm font-medium text-slate-700">Code *</label>
            <InputText id="pm-code" name="code" placeholder="e.g. paystack" fluid />
            <Message v-if="$form.code?.invalid" severity="error" size="small" variant="simple">
              {{ $form.code.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1 md:col-span-2">
            <label class="text-sm font-medium text-slate-700">Description</label>
            <Textarea v-model="description" placeholder="Describe this payment method..." rows="3" fluid />
          </div>

          <div class="flex flex-col gap-1 md:col-span-2">
            <label class="text-sm font-medium text-slate-700">Channels</label>
            <MultiSelect
              v-model="selectedChannels"
              :options="channelOptions"
              placeholder="Select channels"
              fluid
            />
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
