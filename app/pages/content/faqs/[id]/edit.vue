<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ApiError } from "~/composables/apiClient";
import { CONTENT_PERMISSIONS } from "~/constants/contentManagement";
import { useContentManagementStore } from "~/stores/contentManagement";

const route = useRoute();
const store = useContentManagementStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const id = route.params.id;
const serverError = ref("");
const fieldErrors = ref({});

async function onSubmit(payload) {
  serverError.value = "";
  fieldErrors.value = {};
  try {
    await store.saveFaq(payload, id);
    toast.add({ severity: "success", summary: "FAQ saved", life: 3000 });
    await store.fetchFaq(id);
  } catch (exception) {
    serverError.value = exception instanceof ApiError ? exception.message : "Unable to save FAQ";
    fieldErrors.value = exception.errors || {};
  }
}

function confirmPublication() {
  const isPublished = store.faq?.is_published;
  confirm.require({
    header: isPublished ? "Unpublish FAQ" : "Publish FAQ",
    message: isPublished ? "Unpublish this FAQ?" : "Publish this FAQ? Future publication times will schedule it.",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: isPublished ? "Unpublish" : "Publish", severity: isPublished ? "warning" : "success" },
    accept: async () => {
      try {
        if (isPublished) await store.unpublishFaq(id);
        else await store.publishFaq(id);
        toast.add({ severity: "success", summary: isPublished ? "FAQ unpublished" : "FAQ published", life: 3000 });
        await store.fetchFaq(id);
      } catch (exception) {
        toast.add({ severity: "error", summary: "Publication failed", detail: exception.message, life: 4500 });
      }
    },
  });
}

onMounted(async () => {
  await Promise.all([store.fetchStorefronts(), store.fetchFaqCategories(), store.fetchFaq(id)]);
});
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/content/faqs">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900 m-0">Edit FAQ</h1>
      </div>
      <Button
        v-if="store.faq && (store.faq.is_published ? can(CONTENT_PERMISSIONS.faqs.unpublish) : can(CONTENT_PERMISSIONS.faqs.publish))"
        :label="store.faq.is_published ? 'Unpublish' : 'Publish'"
        :icon="store.faq.is_published ? 'pi pi-pause' : 'pi pi-send'"
        :severity="store.faq.is_published ? 'warning' : 'success'"
        :loading="store.mutating"
        @click="confirmPublication"
      />
    </div>

    <div v-if="store.faqLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>
    <ContentManagementPermissionDenied v-else-if="store.permissionDenied.faq" message="Ask a super administrator for the View_Faq permission." />
    <Message v-else-if="store.faqError" severity="error" :closable="false">{{ store.faqError }}</Message>

    <ContentManagementFaqForm
      v-else-if="store.faq"
      :initial-values="store.faq"
      :categories="store.faqCategories"
      :storefronts="store.storefronts"
      :loading="store.saving"
      :server-error="serverError"
      :field-errors="fieldErrors"
      submit-label="Save FAQ"
      @submit="onSubmit"
    />
  </div>
</template>
