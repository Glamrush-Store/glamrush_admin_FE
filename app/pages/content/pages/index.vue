<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ApiError } from "~/composables/apiClient";
import {
  CONTENT_PAGE_TYPE_LABELS,
  CONTENT_PAGE_TYPE_OPTIONS,
  CONTENT_PERMISSIONS,
  PUBLICATION_STATE_OPTIONS,
  PUBLISHED_FILTER_OPTIONS,
} from "~/constants/contentManagement";
import { useContentManagementStore } from "~/stores/contentManagement";
import { slugifyContentValue } from "~/utils/contentPreview";

const store = useContentManagementStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();

const filters = reactive({
  search: route.query.search || "",
  page_type: route.query.page_type || null,
  state: route.query.state || null,
  storefront_id: route.query.storefront_id || null,
  is_published: route.query.is_published === "true" ? true : route.query.is_published === "false" ? false : null,
});
const duplicateVisible = ref(false);
const duplicateSource = ref(null);
const duplicateSlug = ref("");
const duplicateError = ref("");
const previewVisible = ref(false);
const previewPage = ref(null);
let searchTimeout = null;

function syncQuery() {
  const query = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) query[key] = String(value);
  });
  router.replace({ query });
}

function applyFiltersDebounced() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 350);
}

async function applyFilters() {
  syncQuery();
  await store.setPageFilters({ ...filters });
}

function clearFilters() {
  Object.assign(filters, { search: "", page_type: null, state: null, storefront_id: null, is_published: null });
  store.resetPageFilters();
  router.replace({ query: {} });
}

function onPageChange(event) {
  store.setPagePage(event.page + 1, event.rows);
}

function onSort(event) {
  store.setPageSorting(event.sortField || "updated_at", event.sortOrder === 1 ? "asc" : "desc");
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function storefrontScope(item) {
  if (item.applies_to_all_storefronts) return "All storefronts";
  if (!item.storefronts?.length) return "No storefronts";
  return item.storefronts.map((storefront) => storefront.name).join(", ");
}

function openPreview(item) {
  previewPage.value = item;
  previewVisible.value = true;
}

function openDuplicate(item) {
  duplicateSource.value = item;
  duplicateSlug.value = `${slugifyContentValue(item.slug || item.title)}-copy`;
  duplicateError.value = "";
  duplicateVisible.value = true;
}

async function duplicatePage() {
  duplicateError.value = "";
  try {
    const response = await store.duplicatePage(duplicateSource.value.id, duplicateSlug.value);
    duplicateVisible.value = false;
    toast.add({ severity: "success", summary: "Page duplicated", life: 3000 });
    await navigateTo(`/content/pages/${response.data.id}/edit`);
  } catch (e) {
    duplicateError.value = e instanceof ApiError ? e.message : "Unable to duplicate page";
  }
}

function confirmPublish(item) {
  confirm.require({
    header: item.is_published ? "Unpublish Page" : "Publish Page",
    message: item.is_published ? `Unpublish "${item.title}"?` : `Publish "${item.title}"? Future publication times will schedule the page.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: item.is_published ? "Unpublish" : "Publish", severity: item.is_published ? "warning" : "success" },
    accept: async () => {
      try {
        if (item.is_published) await store.unpublishPage(item.id);
        else await store.publishPage(item.id);
        toast.add({ severity: "success", summary: item.is_published ? "Page unpublished" : "Page published", life: 3000 });
        await store.fetchPages();
      } catch (e) {
        toast.add({ severity: "error", summary: "Publication failed", detail: e.message, life: 4500 });
      }
    },
  });
}

function confirmDelete(item) {
  confirm.require({
    header: "Delete Page",
    message: `Delete "${item.title}"? This removes it from administrative and public lookup.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deletePage(item.id);
        toast.add({ severity: "success", summary: "Page deleted", life: 3000 });
        await store.fetchPages();
      } catch (e) {
        toast.add({ severity: "error", summary: "Delete failed", detail: e.message, life: 4500 });
      }
    },
  });
}

onMounted(async () => {
  await Promise.all([store.fetchStorefronts(), store.fetchPages()]);
});

onBeforeUnmount(() => clearTimeout(searchTimeout));
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Content Pages</h1>
      <NuxtLink v-if="can(CONTENT_PERMISSIONS.pages.create)" to="/content/pages/new">
        <Button label="New Page" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <ContentManagementPermissionDenied
      v-if="store.permissionDenied.pages"
      message="Ask a super administrator for the View_ContentPage permission."
    />

    <template v-else>
      <div class="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Search</label>
            <InputText v-model="filters.search" placeholder="Title, slug, content..." @input="applyFiltersDebounced" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Page Type</label>
            <Select v-model="filters.page_type" :options="[{ label: 'All Types', value: null }, ...CONTENT_PAGE_TYPE_OPTIONS]" option-label="label" option-value="value" @update:model-value="applyFilters" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">State</label>
            <Select v-model="filters.state" :options="PUBLICATION_STATE_OPTIONS" option-label="label" option-value="value" @update:model-value="applyFilters" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Storefront</label>
            <Select v-model="filters.storefront_id" :options="[{ name: 'All Storefronts', id: null }, ...store.storefronts]" option-label="name" option-value="id" @update:model-value="applyFilters" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Published Flag</label>
            <Select v-model="filters.is_published" :options="PUBLISHED_FILTER_OPTIONS" option-label="label" option-value="value" @update:model-value="applyFilters" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
          <Button label="Retry" icon="pi pi-refresh" severity="secondary" text :loading="store.pagesLoading" @click="store.fetchPages" />
        </div>
      </div>

      <Message v-if="store.pagesError" severity="error" :closable="false" class="mb-4">
        {{ store.pagesError }}
      </Message>

      <DataTable
        :value="store.pages"
        :loading="store.pagesLoading"
        lazy
        striped-rows
        removable-sort
        sort-mode="single"
        :total-records="store.pagePagination.total"
        class="mb-4"
        @sort="onSort"
      >
        <template #empty>
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-file-edit text-3xl mb-3" />
            <p class="m-0 font-medium text-slate-800">No content pages found</p>
            <p class="mb-0 mt-1 text-sm">Create a page or clear filters.</p>
          </div>
        </template>

        <Column field="title" header="Title" sortable>
          <template #body="{ data }">
            <div>
              <p class="font-semibold text-slate-900 m-0">{{ data.title }}</p>
              <p class="text-sm text-slate-500 m-0">/{{ data.slug }}</p>
            </div>
          </template>
        </Column>
        <Column field="page_type" header="Type" sortable>
          <template #body="{ data }">{{ CONTENT_PAGE_TYPE_LABELS[data.page_type] || data.page_type }}</template>
        </Column>
        <Column header="Storefront Scope">
          <template #body="{ data }">
            <span class="text-sm text-slate-700">{{ storefrontScope(data) }}</span>
          </template>
        </Column>
        <Column field="state" header="State">
          <template #body="{ data }"><ContentManagementStateBadge :state="data.state" /></template>
        </Column>
        <Column field="published_at" header="Published" sortable>
          <template #body="{ data }">{{ formatDate(data.published_at) }}</template>
        </Column>
        <Column field="expires_at" header="Expires" sortable>
          <template #body="{ data }">{{ formatDate(data.expires_at) }}</template>
        </Column>
        <Column field="display_order" header="Order" sortable />
        <Column field="updated_at" header="Updated" sortable>
          <template #body="{ data }">{{ formatDate(data.updated_at) }}</template>
        </Column>
        <Column header="Actions" class="w-56">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button icon="pi pi-eye" severity="info" text rounded aria-label="Preview page" @click="openPreview(data)" />
              <NuxtLink v-if="can(CONTENT_PERMISSIONS.pages.update)" :to="`/content/pages/${data.id}/edit`">
                <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit page" />
              </NuxtLink>
              <Button v-if="data.is_published ? can(CONTENT_PERMISSIONS.pages.unpublish) : can(CONTENT_PERMISSIONS.pages.publish)" :icon="data.is_published ? 'pi pi-pause' : 'pi pi-send'" :severity="data.is_published ? 'warning' : 'success'" text rounded aria-label="Change publication" @click="confirmPublish(data)" />
              <Button v-if="can(CONTENT_PERMISSIONS.pages.duplicate)" icon="pi pi-copy" severity="secondary" text rounded aria-label="Duplicate page" @click="openDuplicate(data)" />
              <Button v-if="can(CONTENT_PERMISSIONS.pages.delete)" icon="pi pi-trash" severity="danger" text rounded aria-label="Delete page" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>

      <Paginator
        :rows="store.pagePagination.per_page"
        :total-records="store.pagePagination.total"
        :first="(store.pagePagination.current_page - 1) * store.pagePagination.per_page"
        :rows-per-page-options="[15, 20, 50, 100]"
        @page="onPageChange"
      />
    </template>

    <Dialog v-model:visible="duplicateVisible" modal header="Duplicate Page" :style="{ width: '32rem' }">
      <div class="grid grid-cols-1 gap-3">
        <Message v-if="duplicateError" severity="error" :closable="false">{{ duplicateError }}</Message>
        <Message severity="info" :closable="false">The duplicate is created as a draft. Enter a unique slug.</Message>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">New Slug</label>
          <InputText v-model="duplicateSlug" autofocus fluid />
        </div>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" text @click="duplicateVisible = false" />
          <Button label="Duplicate" icon="pi pi-copy" :loading="store.mutating" @click="duplicatePage" />
        </div>
      </div>
    </Dialog>

    <ContentManagementPreviewDialog
      v-if="previewPage"
      v-model:visible="previewVisible"
      :title="previewPage.title"
      :excerpt="previewPage.excerpt"
      :html="previewPage.content"
      :settings="previewPage.page_type === 'contact' ? previewPage.settings : null"
    />
  </div>
</template>
