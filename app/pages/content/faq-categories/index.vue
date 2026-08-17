<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ApiError } from "~/composables/apiClient";
import { ACTIVE_FILTER_OPTIONS, CONTENT_PERMISSIONS } from "~/constants/contentManagement";
import { useContentManagementStore } from "~/stores/contentManagement";

const store = useContentManagementStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const filters = reactive({ search: "", is_active: null });
const dialogVisible = ref(false);
const editingCategory = ref(null);
const serverError = ref("");
const fieldErrors = ref({});
let searchTimeout = null;

const canReorder = computed(() =>
  can(CONTENT_PERMISSIONS.faqCategories.reorder)
  && !filters.search
  && filters.is_active === null
  && store.categoryPagination.total === store.faqCategories.length
);

function applyFiltersDebounced() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => store.setCategoryFilters({ ...filters }), 350);
}

function clearFilters() {
  Object.assign(filters, { search: "", is_active: null });
  store.resetCategoryFilters();
}

function openCreate() {
  editingCategory.value = null;
  serverError.value = "";
  fieldErrors.value = {};
  dialogVisible.value = true;
}

function openEdit(category) {
  editingCategory.value = category;
  serverError.value = "";
  fieldErrors.value = {};
  dialogVisible.value = true;
}

async function saveCategory(payload) {
  serverError.value = "";
  fieldErrors.value = {};
  try {
    await store.saveFaqCategory(payload, editingCategory.value?.id || null);
    dialogVisible.value = false;
    toast.add({ severity: "success", summary: "Category saved", life: 3000 });
    await store.fetchFaqCategories();
  } catch (exception) {
    serverError.value = exception instanceof ApiError ? exception.message : "Unable to save category";
    fieldErrors.value = exception.errors || {};
  }
}

function confirmDelete(category) {
  confirm.require({
    header: "Delete FAQ Category",
    message: `Delete "${category.name}"? FAQs must be moved or deleted first if the API reports a conflict.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteFaqCategory(category.id);
        toast.add({ severity: "success", summary: "Category deleted", life: 3000 });
        await store.fetchFaqCategories();
      } catch (exception) {
        toast.add({ severity: exception.status === 409 ? "warn" : "error", summary: "Delete failed", detail: exception.message, life: 5000 });
      }
    },
  });
}

async function moveCategory(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= store.faqCategories.length) return;
  const reordered = [...store.faqCategories];
  const [item] = reordered.splice(index, 1);
  reordered.splice(nextIndex, 0, item);
  const previous = [...store.faqCategories];
  store.faqCategories = reordered;
  try {
    await store.reorderFaqCategories(reordered.map((category) => category.id));
    toast.add({ severity: "success", summary: "Category order saved", life: 2500 });
    await store.fetchFaqCategories();
  } catch (exception) {
    store.faqCategories = previous;
    toast.add({ severity: "error", summary: "Reorder failed", detail: exception.message, life: 4500 });
  }
}

onMounted(() => store.fetchFaqCategories());
onBeforeUnmount(() => clearTimeout(searchTimeout));
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold text-slate-900">FAQ Categories</h1>
      <Button v-if="can(CONTENT_PERMISSIONS.faqCategories.create)" label="New Category" icon="pi pi-plus" @click="openCreate" />
    </div>

    <ContentManagementPermissionDenied
      v-if="store.permissionDenied.categories"
      message="Ask a super administrator for the View_FaqCategory permission."
    />

    <template v-else>
      <div class="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Search</label>
            <InputText v-model="filters.search" placeholder="Name..." class="w-64" @input="applyFiltersDebounced" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Active</label>
            <Select v-model="filters.is_active" :options="ACTIVE_FILTER_OPTIONS" option-label="label" option-value="value" class="w-44" @update:model-value="store.setCategoryFilters({ ...filters })" />
          </div>
          <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
        </div>
        <Message v-if="!canReorder" severity="info" :closable="false" class="mt-3">
          Reordering is enabled only with reorder permission, no filters, and the complete loaded list.
        </Message>
      </div>

      <Message v-if="store.categoriesError" severity="error" :closable="false" class="mb-4">{{ store.categoriesError }}</Message>

      <DataTable :value="store.faqCategories" :loading="store.categoriesLoading" striped-rows class="mb-4">
        <template #empty>
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-list text-3xl mb-3" />
            <p class="m-0 font-medium text-slate-800">No FAQ categories found</p>
          </div>
        </template>
        <Column header="Order" class="w-28">
          <template #body="{ data, index }">
            <div class="flex items-center gap-1">
              <Button icon="pi pi-arrow-up" severity="secondary" text rounded :disabled="!canReorder || index === 0" aria-label="Move category up" @click="moveCategory(index, -1)" />
              <Button icon="pi pi-arrow-down" severity="secondary" text rounded :disabled="!canReorder || index === store.faqCategories.length - 1" aria-label="Move category down" @click="moveCategory(index, 1)" />
              <span class="text-sm text-slate-500">{{ data.display_order }}</span>
            </div>
          </template>
        </Column>
        <Column field="name" header="Name">
          <template #body="{ data }">
            <div>
              <p class="font-semibold text-slate-900 m-0">{{ data.name }}</p>
              <p class="text-sm text-slate-500 m-0">/{{ data.slug }}</p>
            </div>
          </template>
        </Column>
        <Column field="description" header="Description" />
        <Column field="is_active" header="Status">
          <template #body="{ data }">
            <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column field="faqs_count" header="FAQs" />
        <Column header="Actions" class="w-32">
          <template #body="{ data }">
            <Button v-if="can(CONTENT_PERMISSIONS.faqCategories.update)" icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit category" @click="openEdit(data)" />
            <Button v-if="can(CONTENT_PERMISSIONS.faqCategories.delete)" icon="pi pi-trash" severity="danger" text rounded aria-label="Delete category" @click="confirmDelete(data)" />
          </template>
        </Column>
      </DataTable>

      <Paginator
        :rows="store.categoryPagination.per_page"
        :total-records="store.categoryPagination.total"
        :first="(store.categoryPagination.current_page - 1) * store.categoryPagination.per_page"
        :rows-per-page-options="[50, 100]"
        @page="store.setCategoryPage($event.page + 1, $event.rows)"
      />
    </template>

    <Dialog v-model:visible="dialogVisible" modal :header="editingCategory ? 'Edit FAQ Category' : 'New FAQ Category'" :style="{ width: '42rem' }">
      <ContentManagementFaqCategoryForm
        :initial-values="editingCategory || {}"
        :loading="store.saving"
        :server-error="serverError"
        :field-errors="fieldErrors"
        @submit="saveCategory"
        @cancel="dialogVisible = false"
      />
    </Dialog>
  </div>
</template>
