<script setup>
import { ApiError } from "~/composables/apiClient";
import { useContentManagementStore } from "~/stores/contentManagement";

const store = useContentManagementStore();
const serverError = ref("");
const fieldErrors = ref({});

const initialValues = {
  page_type: "custom",
  content: "<p></p>",
  is_published: false,
  applies_to_all_storefronts: true,
  display_order: 0,
};

async function onSubmit(payload) {
  serverError.value = "";
  fieldErrors.value = {};
  try {
    const response = await store.savePage(payload);
    await navigateTo(`/content/pages/${response.data.id}/edit`);
  } catch (exception) {
    serverError.value = exception instanceof ApiError ? exception.message : "Unable to save page";
    fieldErrors.value = exception.errors || {};
  }
}

onMounted(() => store.fetchStorefronts());
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/content/pages">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">New Content Page</h1>
    </div>

    <ContentManagementContentPageForm
      :initial-values="initialValues"
      :storefronts="store.storefronts"
      :loading="store.saving"
      :server-error="serverError"
      :field-errors="fieldErrors"
      submit-label="Create Page"
      @submit="onSubmit"
    />
  </div>
</template>
