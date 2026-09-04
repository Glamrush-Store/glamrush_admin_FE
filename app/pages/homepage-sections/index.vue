<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { ApiError } from "~/composables/apiClient";
import {
  HOMEPAGE_SECTION_ACTIVE_OPTIONS,
  HOMEPAGE_SECTION_PERMISSIONS,
  HOMEPAGE_SECTION_TYPE_LABELS,
  HOMEPAGE_SECTION_TYPES,
  formatHomepageSectionDate,
  formatHomepageSectionWindow,
} from "~/constants/homepageSections";
import { useHomepageSectionStore } from "~/stores/homepageSection";

const store = useHomepageSectionStore();
const confirm = useConfirm();
const toast = useToast();
const { can } = usePermissions();

const dialogVisible = shallowRef(false);
const editingSection = ref(null);
const validationErrors = ref({});
const serverError = shallowRef("");

const canList = computed(() => can(HOMEPAGE_SECTION_PERMISSIONS.list));
const canCreate = computed(() => can(HOMEPAGE_SECTION_PERMISSIONS.create));
const canUpdate = computed(() => can(HOMEPAGE_SECTION_PERMISSIONS.update));
const canDelete = computed(() => can(HOMEPAGE_SECTION_PERMISSIONS.delete));

function typeLabel(type) {
  return HOMEPAGE_SECTION_TYPE_LABELS[type] || type || "-";
}

function activeSeverity(section) {
  return section.is_active ? "success" : "danger";
}

function relationCount(section, idsKey, relationKey) {
  if (Array.isArray(section?.[idsKey])) return section[idsKey].length;
  if (Array.isArray(section?.[relationKey])) return section[relationKey].length;
  return 0;
}

async function loadSections(overrides = {}) {
  try {
    await store.fetchSections(overrides);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Homepage sections unavailable",
      detail: error.message || "Unable to load homepage sections",
      life: 4500,
    });
  }
}

async function loadSelectorOptions() {
  try {
    await store.fetchSelectorOptions();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Selector options unavailable",
      detail: error.message || "Unable to load products and categories",
      life: 4500,
    });
  }
}

async function openCreateDialog() {
  editingSection.value = null;
  validationErrors.value = {};
  serverError.value = "";
  dialogVisible.value = true;
  if (!store.products.length || !store.categories.length) await loadSelectorOptions();
}

async function openEditDialog(section) {
  editingSection.value = section;
  validationErrors.value = {};
  serverError.value = "";
  dialogVisible.value = true;
  if (!store.products.length || !store.categories.length) await loadSelectorOptions();
}

function handleValidationError(error, fallback) {
  if (error instanceof ApiError && error.status === 422) {
    validationErrors.value = error.errors || {};
    serverError.value = error.message || fallback;
    return;
  }

  serverError.value = error.message || fallback;
}

async function submitSection(payload) {
  validationErrors.value = {};
  serverError.value = "";

  try {
    const response = editingSection.value?.id
      ? await store.updateSection(editingSection.value.id, payload)
      : await store.createSection(payload);

    dialogVisible.value = false;
    toast.add({
      severity: "success",
      summary: response.message || (editingSection.value?.id ? "Section updated" : "Section created"),
      life: 3500,
    });
    await loadSections();
  } catch (error) {
    handleValidationError(error, "Unable to save homepage section");
  }
}

function confirmDelete(section) {
  confirm.require({
    message: `Delete "${section.name}"? This removes it from the storefront homepage configuration.`,
    header: "Delete homepage section",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Delete",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        const response = await store.deleteSection(section.id);
        toast.add({
          severity: "success",
          summary: response.message || "Homepage section deleted",
          life: 3500,
        });
        await loadSections();
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Delete failed",
          detail: error.message || "Unable to delete homepage section",
          life: 4500,
        });
      }
    },
  });
}

function moveSection(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= store.sections.length) return;

  const next = [...store.sections];
  const [section] = next.splice(index, 1);
  next.splice(target, 0, section);
  store.sections = next.map((item, itemIndex) => ({
    ...item,
    sort_order: itemIndex,
  }));
}

async function saveOrder() {
  try {
    const response = await store.reorderSections(store.sections);
    toast.add({
      severity: "success",
      summary: response.message || "Homepage sections reordered",
      life: 3500,
    });
    await loadSections();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Reorder failed",
      detail: error.message || "Unable to save homepage section order",
      life: 4500,
    });
  }
}

async function resetFilters() {
  try {
    await store.resetFilters();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Reset failed",
      detail: error.message || "Unable to reset filters",
      life: 4500,
    });
  }
}

onMounted(() => {
  if (canList.value) loadSections();
});
</script>

<template>
  <div class="space-y-5">
    <ConfirmDialog />
    <Toast />

    <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Homepage Sections</h1>
        <p class="m-0 mt-1 text-sm text-slate-500">
          Manage the ordered content blocks that appear on the storefront homepage.
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
          @click="loadSections()"
        />
        <Button
          v-if="canUpdate"
          label="Save order"
          icon="pi pi-sort-alt"
          severity="secondary"
          outlined
          :loading="store.reorderLoading"
          :disabled="store.loading || store.reorderLoading || !store.sections.length"
          @click="saveOrder"
        />
        <Button
          v-if="canCreate"
          label="Add section"
          icon="pi pi-plus"
          :disabled="store.actionLoading"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <Message v-if="!canList" severity="error" :closable="false">
      You do not have permission to view homepage sections.
    </Message>

    <template v-else>
      <Message v-if="store.error" severity="error" :closable="false">
        {{ store.error }}
      </Message>

      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(12rem,18rem)_minmax(12rem,16rem)_auto] md:items-end">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">Type</label>
            <Select
              :model-value="store.filters.type"
              :options="[{ label: 'All types', value: null }, ...HOMEPAGE_SECTION_TYPES]"
              option-label="label"
              option-value="value"
              placeholder="All types"
              :disabled="store.loading"
              @update:model-value="store.setFilter('type', $event)"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">Status</label>
            <Select
              :model-value="store.filters.is_active"
              :options="HOMEPAGE_SECTION_ACTIVE_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Any status"
              :disabled="store.loading"
              @update:model-value="store.setFilter('is_active', $event)"
            />
          </div>

          <Button
            label="Clear filters"
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            :disabled="store.loading"
            @click="resetFilters"
          />
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <DataTable
          :value="store.sections"
          :loading="store.loading"
          data-key="id"
          responsive-layout="scroll"
          striped-rows
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <i class="pi pi-th-large text-2xl text-slate-300" />
              <p class="m-0 font-medium text-slate-700">No homepage sections configured yet.</p>
              <p class="m-0 text-sm text-slate-500">Create a section to start shaping the storefront homepage.</p>
            </div>
          </template>

          <Column header="Name">
            <template #body="{ data }">
              <div>
                <p class="m-0 font-semibold text-slate-900">{{ data.name }}</p>
                <p class="m-0 text-xs text-slate-500">
                  {{ relationCount(data, "product_ids", "products") }} products |
                  {{ relationCount(data, "category_ids", "categories") }} categories
                </p>
              </div>
            </template>
          </Column>

          <Column field="type" header="Type">
            <template #body="{ data }">
              <Tag :value="typeLabel(data.type)" severity="info" />
            </template>
          </Column>

          <Column field="title" header="Title">
            <template #body="{ data }">
              <div class="max-w-[18rem]">
                <p class="m-0 font-medium text-slate-800">{{ data.title }}</p>
                <p class="m-0 truncate text-sm text-slate-500">{{ data.subtitle || "-" }}</p>
              </div>
            </template>
          </Column>

          <Column field="is_active" header="Active status">
            <template #body="{ data }">
              <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="activeSeverity(data)" />
            </template>
          </Column>

          <Column field="sort_order" header="Sort order">
            <template #body="{ data, index }">
              <div class="flex items-center gap-2">
                <span class="min-w-8 font-mono text-sm text-slate-700">{{ data.sort_order ?? index }}</span>
                <div v-if="canUpdate" class="flex items-center gap-1">
                  <Button
                    icon="pi pi-chevron-up"
                    severity="secondary"
                    text
                    rounded
                    :disabled="index === 0 || store.reorderLoading"
                    @click="moveSection(index, -1)"
                  />
                  <Button
                    icon="pi pi-chevron-down"
                    severity="secondary"
                    text
                    rounded
                    :disabled="index === store.sections.length - 1 || store.reorderLoading"
                    @click="moveSection(index, 1)"
                  />
                </div>
              </div>
            </template>
          </Column>

          <Column header="Publish window">
            <template #body="{ data }">
              <span class="text-sm text-slate-600">{{ formatHomepageSectionWindow(data) }}</span>
            </template>
          </Column>

          <Column field="updated_at" header="Updated at">
            <template #body="{ data }">{{ formatHomepageSectionDate(data.updated_at) }}</template>
          </Column>

          <Column header="Actions" class="w-32">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
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
      </div>

      <HomepageSectionsHomepageSectionFormDialog
        v-model:visible="dialogVisible"
        :section="editingSection"
        :products="store.products"
        :categories="store.categories"
        :loading="store.actionLoading"
        :selector-loading="store.selectorLoading"
        :errors="validationErrors"
        :server-error="serverError"
        @submit="submitSection"
      />
    </template>
  </div>
</template>
