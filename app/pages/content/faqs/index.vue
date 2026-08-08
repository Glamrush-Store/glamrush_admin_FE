<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import {
  CONTENT_PERMISSIONS,
  PUBLICATION_STATE_OPTIONS,
  PUBLISHED_FILTER_OPTIONS,
} from "~/constants/contentManagement";
import { useContentManagementStore } from "~/stores/contentManagement";

const store = useContentManagementStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const filters = reactive({ search: "", faq_category_id: null, state: null, storefront_id: null, is_published: null });
const previewVisible = ref(false);
const previewFaq = ref(null);
let searchTimeout = null;

const canReorder = computed(() =>
  can(CONTENT_PERMISSIONS.faqs.reorder)
  && !filters.search
  && !filters.state
  && filters.is_published === null
  && store.faqPagination.total === store.faqs.length
);

function applyFiltersDebounced() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => store.setFaqFilters({ ...filters }), 350);
}

function clearFilters() {
  Object.assign(filters, { search: "", faq_category_id: null, state: null, storefront_id: null, is_published: null });
  store.resetFaqFilters();
}

function onPageChange(event) {
  store.setFaqPage(event.page + 1, event.rows);
}

function onSort(event) {
  store.setFaqSorting(event.sortField || "updated_at", event.sortOrder === 1 ? "asc" : "desc");
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
  previewFaq.value = item;
  previewVisible.value = true;
}

function confirmPublication(item) {
  confirm.require({
    header: item.is_published ? "Unpublish FAQ" : "Publish FAQ",
    message: item.is_published ? `Unpublish "${item.question}"?` : `Publish "${item.question}"? Future publication times will schedule it.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: item.is_published ? "Unpublish" : "Publish", severity: item.is_published ? "warning" : "success" },
    accept: async () => {
      try {
        if (item.is_published) await store.unpublishFaq(item.id);
        else await store.publishFaq(item.id);
        toast.add({ severity: "success", summary: item.is_published ? "FAQ unpublished" : "FAQ published", life: 3000 });
        await store.fetchFaqs();
      } catch (exception) {
        toast.add({ severity: "error", summary: "Publication failed", detail: exception.message, life: 4500 });
      }
    },
  });
}

async function duplicateFaq(item) {
  try {
    const response = await store.duplicateFaq(item.id);
    toast.add({ severity: "success", summary: "FAQ duplicated", life: 3000 });
    await navigateTo(`/content/faqs/${response.data.id}/edit`);
  } catch (exception) {
    toast.add({ severity: "error", summary: "Duplicate failed", detail: exception.message, life: 4500 });
  }
}

function confirmDelete(item) {
  confirm.require({
    header: "Delete FAQ",
    message: `Delete "${item.question}"?`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteFaq(item.id);
        toast.add({ severity: "success", summary: "FAQ deleted", life: 3000 });
        await store.fetchFaqs();
      } catch (exception) {
        toast.add({ severity: "error", summary: "Delete failed", detail: exception.message, life: 4500 });
      }
    },
  });
}

async function moveFaq(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= store.faqs.length) return;
  const reordered = [...store.faqs];
  const [item] = reordered.splice(index, 1);
  reordered.splice(nextIndex, 0, item);
  const previous = [...store.faqs];
  store.faqs = reordered;
  try {
    await store.reorderFaqs(reordered.map((faq) => faq.id));
    toast.add({ severity: "success", summary: "FAQ order saved", life: 2500 });
    await store.fetchFaqs();
  } catch (exception) {
    store.faqs = previous;
    toast.add({ severity: "error", summary: "Reorder failed", detail: exception.message, life: 4500 });
  }
}

onMounted(async () => {
  await Promise.all([store.fetchStorefronts(), store.fetchFaqCategories(), store.fetchFaqs()]);
});

onBeforeUnmount(() => clearTimeout(searchTimeout));
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold text-slate-900">FAQs</h1>
      <NuxtLink v-if="can(CONTENT_PERMISSIONS.faqs.create)" to="/content/faqs/new">
        <Button label="New FAQ" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <ContentManagementPermissionDenied
      v-if="store.permissionDenied.faqs"
      message="Ask a super administrator for the View_Faq permission."
    />

    <template v-else>
      <div class="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Search</label>
            <InputText v-model="filters.search" placeholder="Question..." @input="applyFiltersDebounced" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Category</label>
            <Select v-model="filters.faq_category_id" :options="[{ name: 'All Categories', id: null }, ...store.faqCategories]" option-label="name" option-value="id" @update:model-value="store.setFaqFilters({ ...filters })" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">State</label>
            <Select v-model="filters.state" :options="PUBLICATION_STATE_OPTIONS" option-label="label" option-value="value" @update:model-value="store.setFaqFilters({ ...filters })" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Storefront</label>
            <Select v-model="filters.storefront_id" :options="[{ name: 'All Storefronts', id: null }, ...store.storefronts]" option-label="name" option-value="id" @update:model-value="store.setFaqFilters({ ...filters })" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Published Flag</label>
            <Select v-model="filters.is_published" :options="PUBLISHED_FILTER_OPTIONS" option-label="label" option-value="value" @update:model-value="store.setFaqFilters({ ...filters })" />
          </div>
        </div>
        <div class="flex justify-between gap-2 mt-3">
          <Message v-if="!canReorder" severity="info" :closable="false" class="m-0">
            Reorder is enabled only when the complete intended ordering context is visible.
          </Message>
          <div class="ml-auto">
            <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
          </div>
        </div>
      </div>

      <Message v-if="store.faqsError" severity="error" :closable="false" class="mb-4">{{ store.faqsError }}</Message>

      <DataTable :value="store.faqs" :loading="store.faqsLoading" lazy striped-rows removable-sort sort-mode="single" :total-records="store.faqPagination.total" class="mb-4" @sort="onSort">
        <template #empty>
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-question-circle text-3xl mb-3" />
            <p class="m-0 font-medium text-slate-800">No FAQs found</p>
          </div>
        </template>
        <Column header="Order" class="w-28">
          <template #body="{ data, index }">
            <div class="flex items-center gap-1">
              <Button icon="pi pi-arrow-up" severity="secondary" text rounded :disabled="!canReorder || index === 0" aria-label="Move FAQ up" @click="moveFaq(index, -1)" />
              <Button icon="pi pi-arrow-down" severity="secondary" text rounded :disabled="!canReorder || index === store.faqs.length - 1" aria-label="Move FAQ down" @click="moveFaq(index, 1)" />
              <span class="text-sm text-slate-500">{{ data.display_order }}</span>
            </div>
          </template>
        </Column>
        <Column field="question" header="Question" sortable />
        <Column header="Category">
          <template #body="{ data }">{{ data.category?.name || "-" }}</template>
        </Column>
        <Column header="Storefront Scope">
          <template #body="{ data }">{{ storefrontScope(data) }}</template>
        </Column>
        <Column field="state" header="State">
          <template #body="{ data }"><ContentManagementStateBadge :state="data.state" /></template>
        </Column>
        <Column field="published_at" header="Published" sortable>
          <template #body="{ data }">{{ formatDate(data.published_at) }}</template>
        </Column>
        <Column field="updated_at" header="Updated" sortable>
          <template #body="{ data }">{{ formatDate(data.updated_at) }}</template>
        </Column>
        <Column header="Actions" class="w-56">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button icon="pi pi-eye" severity="info" text rounded aria-label="Preview FAQ" @click="openPreview(data)" />
              <NuxtLink v-if="can(CONTENT_PERMISSIONS.faqs.update)" :to="`/content/faqs/${data.id}/edit`">
                <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit FAQ" />
              </NuxtLink>
              <Button v-if="data.is_published ? can(CONTENT_PERMISSIONS.faqs.unpublish) : can(CONTENT_PERMISSIONS.faqs.publish)" :icon="data.is_published ? 'pi pi-pause' : 'pi pi-send'" :severity="data.is_published ? 'warning' : 'success'" text rounded aria-label="Change publication" @click="confirmPublication(data)" />
              <Button v-if="can(CONTENT_PERMISSIONS.faqs.duplicate)" icon="pi pi-copy" severity="secondary" text rounded aria-label="Duplicate FAQ" @click="duplicateFaq(data)" />
              <Button v-if="can(CONTENT_PERMISSIONS.faqs.delete)" icon="pi pi-trash" severity="danger" text rounded aria-label="Delete FAQ" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>

      <Paginator :rows="store.faqPagination.per_page" :total-records="store.faqPagination.total" :first="(store.faqPagination.current_page - 1) * store.faqPagination.per_page" :rows-per-page-options="[15, 20, 50, 100]" @page="onPageChange" />
    </template>

    <ContentManagementPreviewDialog
      v-if="previewFaq"
      v-model:visible="previewVisible"
      :title="previewFaq.question"
      :html="previewFaq.answer"
    />
  </div>
</template>
