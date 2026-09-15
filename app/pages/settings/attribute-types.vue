<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import AttributeTypeDetailsDialog from "~/components/attribute-types/AttributeTypeDetailsDialog.vue";
import AttributeTypeFormDialog from "~/components/attribute-types/AttributeTypeFormDialog.vue";
import { ApiError } from "~/composables/apiClient";
import {
  ATTRIBUTE_TYPE_PERMISSIONS,
  ATTRIBUTE_TYPE_SORT_DIR_OPTIONS,
  ATTRIBUTE_TYPE_SORT_FIELD_OPTIONS,
  normalizeAttributeTypeSortDir,
  normalizeAttributeTypeSortField,
} from "~/constants/attributeTypes";
import { useAttributeTypeStore } from "~/stores/attributeType";

const store = useAttributeTypeStore();
const confirm = useConfirm();
const toast = useToast();
const { can } = usePermissions();

const searchInput = ref(store.filters.search);
const categoryInput = ref(store.filters.category);
const formVisible = shallowRef(false);
const detailsVisible = shallowRef(false);
const editingAttributeType = ref(null);
const validationErrors = ref({});
const serverError = shallowRef("");
const detailsError = shallowRef("");
const backendDenied = shallowRef(false);

let searchTimeout = null;

const canList = computed(() => can(ATTRIBUTE_TYPE_PERMISSIONS.list));
const canView = computed(() => can(ATTRIBUTE_TYPE_PERMISSIONS.view));
const canCreate = computed(() => can(ATTRIBUTE_TYPE_PERMISSIONS.create));
const canUpdate = computed(() => can(ATTRIBUTE_TYPE_PERMISSIONS.update));
const canDelete = computed(() => can(ATTRIBUTE_TYPE_PERMISSIONS.delete));

const firstRecord = computed(() => (store.pagination.current_page - 1) * store.pagination.per_page);
const sortOrder = computed(() => (store.sorting.sort_dir === "desc" ? -1 : 1));

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showError(summary, error, fallback) {
  toast.add({
    severity: "error",
    summary,
    detail: error?.message || fallback,
    life: 5000,
  });
}

async function loadAttributeTypes() {
  try {
    backendDenied.value = false;
    await store.fetchAttributeTypes();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      backendDenied.value = true;
      return;
    }

    showError("Attribute types unavailable", error, "Unable to load attribute types.");
  }
}

function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    try {
      await store.setFilter("search", searchInput.value);
    } catch (error) {
      showError("Search failed", error, "Unable to search attribute types.");
    }
  }, 400);
}

async function applyCategoryFilter() {
  try {
    await store.setFilter("category", categoryInput.value);
  } catch (error) {
    showError("Filter failed", error, "Unable to filter attribute types.");
  }
}

async function clearFilters() {
  searchInput.value = "";
  categoryInput.value = "";

  try {
    await store.resetFilters();
  } catch (error) {
    showError("Reset failed", error, "Unable to reset filters.");
  }
}

async function onSort(event) {
  try {
    const field = normalizeAttributeTypeSortField(event.sortField);
    const direction = event.sortOrder === -1 ? "desc" : "asc";
    await store.setSorting(field, direction);
  } catch (error) {
    showError("Sort failed", error, "Unable to sort attribute types.");
  }
}

async function onManualSortChange() {
  try {
    await store.setSorting(
      normalizeAttributeTypeSortField(store.sorting.sort_by),
      normalizeAttributeTypeSortDir(store.sorting.sort_dir),
    );
  } catch (error) {
    showError("Sort failed", error, "Unable to sort attribute types.");
  }
}

async function onPageChange(event) {
  try {
    await store.setPagination(event.page + 1, event.rows);
  } catch (error) {
    showError("Pagination failed", error, "Unable to load this page.");
  }
}

function openCreateDialog() {
  editingAttributeType.value = null;
  validationErrors.value = {};
  serverError.value = "";
  formVisible.value = true;
}

function openEditDialog(attributeType) {
  editingAttributeType.value = attributeType;
  validationErrors.value = {};
  serverError.value = "";
  formVisible.value = true;
}

async function openDetailsDialog(attributeType) {
  detailsVisible.value = true;
  detailsError.value = "";
  store.attributeType = attributeType;

  try {
    await store.fetchAttributeType(attributeType.id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      detailsError.value = "You do not have permission to view this attribute type.";
      return;
    }

    detailsError.value = error.message || "Unable to load attribute type details.";
  }
}

function setFormError(error, fallback) {
  if (error instanceof ApiError && error.status === 422) {
    validationErrors.value = error.errors || {};
    serverError.value = error.message || fallback;
    return;
  }

  if (error instanceof ApiError && error.status === 409) {
    serverError.value = error.message || "This attribute type is in use by SKU attribute codes and cannot be renamed.";
    return;
  }

  if (error instanceof ApiError && error.status === 403) {
    serverError.value = "You do not have permission to save attribute types.";
    return;
  }

  serverError.value = error?.message || fallback;
}

async function submitAttributeType(payload) {
  validationErrors.value = {};
  serverError.value = "";

  try {
    const response = editingAttributeType.value?.id
      ? await store.updateAttributeType(editingAttributeType.value.id, payload)
      : await store.createAttributeType(payload);

    formVisible.value = false;
    toast.add({
      severity: "success",
      summary: response.message || (editingAttributeType.value?.id ? "Attribute type updated" : "Attribute type created"),
      life: 3500,
    });
    await loadAttributeTypes();
  } catch (error) {
    setFormError(error, "Unable to save attribute type.");
  }
}

function confirmDelete(attributeType) {
  confirm.require({
    message: `Delete "${attributeType.label || attributeType.value}"? This cannot be undone.`,
    header: "Delete attribute type",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Delete",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await store.deleteAttributeType(attributeType.id);
        toast.add({
          severity: "success",
          summary: "Attribute type deleted",
          life: 3500,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast.add({
            severity: "warn",
            summary: "Attribute type is in use",
            detail: error.message || "This attribute type is used by SKU attribute codes and cannot be deleted.",
            life: 6500,
          });
          return;
        }

        if (error instanceof ApiError && error.status === 403) {
          showError("Permission denied", error, "You do not have permission to delete attribute types.");
          return;
        }

        showError("Delete failed", error, "Unable to delete attribute type.");
      }
    },
  });
}

onMounted(() => {
  if (canList.value) loadAttributeTypes();
});
</script>

<template>
  <div class="space-y-5">
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Attribute Types</h1>
        <p class="m-0 mt-1 text-sm text-slate-500">
          Manage reusable attribute type definitions used by SKU attribute codes.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="store.loading"
          :disabled="!canList || store.loading"
          @click="loadAttributeTypes"
        />
        <Button
          v-if="canCreate"
          label="Add attribute type"
          icon="pi pi-plus"
          :disabled="store.actionLoading"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <Message v-if="!canList || backendDenied" severity="error" :closable="false">
      You do not have permission to view attribute types.
    </Message>

    <template v-else>
      <Message v-if="store.error" severity="error" :closable="false">
        {{ store.error }}
      </Message>

      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(14rem,20rem)_minmax(12rem,16rem)_minmax(12rem,14rem)_minmax(10rem,12rem)_auto] lg:items-end">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">Search</label>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchInput"
                placeholder="Search value or label"
                class="w-full"
                :disabled="store.loading"
                @input="onSearchInput"
              />
            </IconField>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">Category</label>
            <InputText
              v-model="categoryInput"
              placeholder="Exact category"
              :disabled="store.loading"
              @keyup.enter="applyCategoryFilter"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">Sort by</label>
            <Select
              v-model="store.sorting.sort_by"
              :options="ATTRIBUTE_TYPE_SORT_FIELD_OPTIONS"
              option-label="label"
              option-value="value"
              :disabled="store.loading"
              @update:model-value="onManualSortChange"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">Direction</label>
            <Select
              v-model="store.sorting.sort_dir"
              :options="ATTRIBUTE_TYPE_SORT_DIR_OPTIONS"
              option-label="label"
              option-value="value"
              :disabled="store.loading"
              @update:model-value="onManualSortChange"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button
              label="Apply"
              icon="pi pi-filter"
              severity="secondary"
              outlined
              :disabled="store.loading"
              @click="applyCategoryFilter"
            />
            <Button
              label="Clear"
              icon="pi pi-filter-slash"
              severity="secondary"
              text
              :disabled="store.loading"
              @click="clearFilters"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <DataTable
          :value="store.attributeTypes"
          :loading="store.loading"
          :total-records="store.pagination.total"
          :sort-field="store.sorting.sort_by"
          :sort-order="sortOrder"
          data-key="id"
          lazy
          responsive-layout="scroll"
          sort-mode="single"
          striped-rows
          @sort="onSort"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <i class="pi pi-sliders-h text-2xl text-slate-300" />
              <p class="m-0 font-medium text-slate-700">No attribute types found.</p>
              <p class="m-0 text-sm text-slate-500">Try adjusting your search or create the first attribute type.</p>
            </div>
          </template>

          <Column field="category" header="Category" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.category || 'Uncategorized'"
                :severity="data.category ? 'info' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="value" header="Value" sortable>
            <template #body="{ data }">
              <span class="font-mono text-sm text-slate-800">{{ data.value }}</span>
            </template>
          </Column>

          <Column field="label" header="Label" sortable>
            <template #body="{ data }">
              <span class="font-medium text-slate-900">{{ data.label }}</span>
            </template>
          </Column>

          <Column field="display_type" header="Display Type" sortable>
            <template #body="{ data }">
              <span class="font-mono text-sm text-slate-700">{{ data.display_type }}</span>
            </template>
          </Column>

          <Column field="created_at" header="Created At" sortable>
            <template #body="{ data }">
              <span class="text-sm text-slate-600">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>

          <Column field="updated_at" header="Updated At" sortable>
            <template #body="{ data }">
              <span class="text-sm text-slate-600">{{ formatDate(data.updated_at) }}</span>
            </template>
          </Column>

          <Column header="Actions" class="w-36">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  v-if="canView"
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  rounded
                  @click="openDetailsDialog(data)"
                />
                <Button
                  v-if="canUpdate"
                  icon="pi pi-pencil"
                  severity="info"
                  text
                  rounded
                  @click="openEditDialog(data)"
                />
                <Button
                  v-if="canDelete"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :disabled="store.actionLoading"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <Paginator
          class="mt-4"
          :rows="store.pagination.per_page"
          :total-records="store.pagination.total"
          :first="firstRecord"
          :rows-per-page-options="[10, 15, 25, 50, 100]"
          @page="onPageChange"
        />
      </div>

      <AttributeTypeFormDialog
        v-model:visible="formVisible"
        :attribute-type="editingAttributeType"
        :loading="store.actionLoading"
        :errors="validationErrors"
        :server-error="serverError"
        @submit="submitAttributeType"
      />

      <AttributeTypeDetailsDialog
        v-model:visible="detailsVisible"
        :attribute-type="store.attributeType"
        :loading="store.detailLoading"
        :server-error="detailsError"
      />
    </template>
  </div>
</template>
