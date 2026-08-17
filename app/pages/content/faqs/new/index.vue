<script setup>
import { ApiError } from "~/composables/apiClient";
import { useContentManagementStore } from "~/stores/contentManagement";

const store = useContentManagementStore();
const serverError = ref("");
const fieldErrors = ref({});

const initialValues = {
  answer: "<p></p>",
  is_published: false,
  applies_to_all_storefronts: true,
  display_order: 0,
};

async function onSubmit(payload) {
  serverError.value = "";
  fieldErrors.value = {};
  try {
    const response = await store.saveFaq(payload);
    await navigateTo(`/content/faqs/${response.data.id}/edit`);
  } catch (exception) {
    serverError.value = exception instanceof ApiError ? exception.message : "Unable to save FAQ";
    fieldErrors.value = exception.errors || {};
  }
}

onMounted(async () => {
  await Promise.all([store.fetchStorefronts(), store.fetchFaqCategories()]);
});
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/content/faqs">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">New FAQ</h1>
    </div>

    <ContentManagementFaqForm
      :initial-values="initialValues"
      :categories="store.faqCategories"
      :storefronts="store.storefronts"
      :loading="store.saving"
      :server-error="serverError"
      :field-errors="fieldErrors"
      submit-label="Create FAQ"
      @submit="onSubmit"
    />
  </div>
</template>
