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
    await store.savePage(payload, id);
    toast.add({ severity: "success", summary: "Page saved", life: 3000 });
    await store.fetchPage(id);
  } catch (exception) {
    serverError.value = exception instanceof ApiError ? exception.message : "Unable to save page";
    fieldErrors.value = exception.errors || {};
  }
}

function confirmPublication() {
  const isPublished = store.page?.is_published;
  confirm.require({
    header: isPublished ? "Unpublish Page" : "Publish Page",
    message: isPublished ? "Unpublish this content page?" : "Publish this content page? Future publication times will schedule it.",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: isPublished ? "Unpublish" : "Publish", severity: isPublished ? "warning" : "success" },
    accept: async () => {
      try {
        if (isPublished) await store.unpublishPage(id);
        else await store.publishPage(id);
        toast.add({ severity: "success", summary: isPublished ? "Page unpublished" : "Page published", life: 3000 });
        await store.fetchPage(id);
      } catch (exception) {
        toast.add({ severity: "error", summary: "Publication failed", detail: exception.message, life: 4500 });
      }
    },
  });
}

onMounted(async () => {
  await Promise.all([store.fetchStorefronts(), store.fetchPage(id)]);
});
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/content/pages">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 m-0">Edit Content Page</h1>
          <p v-if="store.page" class="text-sm text-slate-500 m-0">/{{ store.page.slug }}</p>
        </div>
      </div>

      <Button
        v-if="store.page && (store.page.is_published ? can(CONTENT_PERMISSIONS.pages.unpublish) : can(CONTENT_PERMISSIONS.pages.publish))"
        :label="store.page.is_published ? 'Unpublish' : 'Publish'"
        :icon="store.page.is_published ? 'pi pi-pause' : 'pi pi-send'"
        :severity="store.page.is_published ? 'warning' : 'success'"
        :loading="store.mutating"
        @click="confirmPublication"
      />
    </div>

    <div v-if="store.pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <ContentManagementPermissionDenied
      v-else-if="store.permissionDenied.page"
      message="Ask a super administrator for the View_ContentPage permission."
    />

    <Message v-else-if="store.pageError" severity="error" :closable="false">
      {{ store.pageError }}
    </Message>

    <ContentManagementContentPageForm
      v-else-if="store.page"
      :initial-values="store.page"
      :storefronts="store.storefronts"
      :loading="store.saving"
      :server-error="serverError"
      :field-errors="fieldErrors"
      submit-label="Save Page"
      @submit="onSubmit"
    />
  </div>
</template>
