<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useShippingMethodStore } from "~/stores/shippingMethod";

const methodStore = useShippingMethodStore();

const resolver = yupResolver(
  object({
    name: string().required("Name is required").min(2, "Min 2 characters").max(255, "Max 255 characters"),
    code: string().required("Code is required").min(2, "Min 2 characters").max(100, "Max 100 characters"),
  })
);

const initialValues = { name: "", code: "" };

const description = ref("");
const sortOrder = ref(0);
const isActive = ref(true);

const loading = ref(false);
const serverError = ref("");

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    const payload = {
      name: values.name,
      code: values.code,
      is_active: isActive.value,
      sort_order: sortOrder.value,
    };
    if (description.value) payload.description = description.value;

    const response = await methodStore.createMethod(payload);
    navigateTo(`/shipping/methods/${response.data.id}/edit`);
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
      <NuxtLink to="/shipping/methods">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Create Shipping Method</h1>
    </div>

    <Form v-slot="$form" :initial-values="initialValues" :resolver="resolver" @submit="onSubmit">
      <Message v-if="serverError" severity="error" :closable="false" class="mb-4">{{ serverError }}</Message>

      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Method Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div class="flex flex-col gap-1">
            <label for="name" class="text-sm font-medium text-slate-700">Name *</label>
            <InputText id="name" name="name" placeholder="e.g. Standard Delivery" fluid />
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="code" class="text-sm font-medium text-slate-700">Code *</label>
            <InputText id="code" name="code" placeholder="e.g. standard" fluid />
            <Message v-if="$form.code?.invalid" severity="error" size="small" variant="simple">
              {{ $form.code.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1 md:col-span-2">
            <label class="text-sm font-medium text-slate-700">Description</label>
            <Textarea v-model="description" placeholder="Brief description of this method" rows="3" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Sort Order</label>
            <InputNumber v-model="sortOrder" :min="0" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Active</label>
            <ToggleSwitch v-model="isActive" />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" label="Create Method" icon="pi pi-check" :loading="loading" />
      </div>
    </Form>
  </div>
</template>
