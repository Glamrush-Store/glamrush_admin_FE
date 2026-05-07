<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string, boolean } from "yup";
import { useConfirm } from "primevue/useconfirm";
import { ApiError } from "~/composables/apiClient";
import { useAttributeCodeStore } from "~/stores/attributeCode";

const store = useAttributeCodeStore();
const confirm = useConfirm();

// --- Filters ---
const searchInput = ref("");
let searchTimeout = null;

const typeFilterOptions = computed(() => [
  { label: "All", value: null },
  ...store.types,
]);

function onSearchInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    store.setFilter("search", val);
  }, 400);
}

function onTypeChange(val) {
  store.setFilter("type", val);
}

function clearFilters() {
  searchInput.value = "";
  store.resetFilters();
}

function onSort(event) {
  const order = event.sortOrder === 1 ? "asc" : "desc";
  store.setSorting(event.sortField, order);
}

function onPageChange(event) {
  store.setPage(event.page + 1);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// --- Delete ---
function confirmDelete(row) {
  confirm.require({
    message: `Are you sure you want to delete "${row.value}"?`,
    header: "Confirm Delete",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Delete",
    acceptClass: "p-button-danger",
    accept: () => store.deleteAttributeCode(row.id),
  });
}

// --- Create Modal ---
const showModal = ref(false);
const modalLoading = ref(false);
const serverError = ref("");
const validationErrors = ref({});
const isActive = ref(true);
const selectedTypeValue = ref(null);
const metaHex = ref(null);

const selectedDisplayType = computed(
  () => store.types.find((t) => t.value === selectedTypeValue.value)?.display_type ?? null,
);

const resolver = yupResolver(
  object({
    type: string().required("Type is required"),
    value: string()
      .required("Value is required")
      .min(1, "Min 1 character")
      .max(255, "Max 255 characters"),
    code: string()
      .required("Code is required")
      .min(1, "Min 1 character")
      .max(50, "Max 50 characters"),
  }),
);

const initialValues = {
  type: "",
  value: "",
  code: "",
};

function openModal() {
  serverError.value = "";
  validationErrors.value = {};
  isActive.value = true;
  selectedTypeValue.value = null;
  metaHex.value = null;
  showModal.value = true;
}

async function onSubmit({ valid, values }) {
  if (!valid) return;

  validationErrors.value = {};
  modalLoading.value = true;
  serverError.value = "";

  try {
    let meta = null;
    if (selectedDisplayType.value === "color_swatch" && metaHex.value) {
      meta = { hex: `#${metaHex.value}` };
    }

    await store.createAttributeCode({
      type: values.type,
      value: values.value,
      code: values.code,
      is_active: isActive.value,
      meta,
    });
    showModal.value = false;
    store.fetchAttributeCodes();
  } catch (e) {
    if (e instanceof ApiError) {
      serverError.value = e.message;
      if (e.errors) validationErrors.value = e.errors;
    } else {
      serverError.value = "An unexpected error occurred";
    }
  } finally {
    modalLoading.value = false;
  }
}

onMounted(() => {
  store.fetchTypes();
  store.fetchAttributeCodes();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Attribute Codes</h1>
      <Button label="Add New" icon="pi pi-plus" @click="openModal" />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Search</label>
        <InputText
          v-model="searchInput"
          placeholder="Search..."
          class="w-48"
          @input="onSearchInput(searchInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Type</label>
        <Select
          :model-value="store.filters.type"
          :options="typeFilterOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-40"
          @update:model-value="onTypeChange"
        />
      </div>

      <Button
        label="Clear Filters"
        icon="pi pi-filter-slash"
        severity="secondary"
        text
        @click="clearFilters"
      />
    </div>

    <!-- DataTable -->
    <DataTable
      :value="store.attributeCodes"
      :loading="store.loading"
      lazy
      :total-records="store.pagination.total"
      @sort="onSort"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
    >
      <Column field="type" header="Type" sortable />
      <Column field="value" header="Value" sortable />
      <Column field="code" header="Code" />
      <Column field="display_type" header="Display Type">
        <template #body="{ data }">
          <span class="text-sm font-mono text-slate-600">{{ data.display_type ?? "-" }}</span>
        </template>
      </Column>
      <Column field="meta" header="Meta">
        <template #body="{ data }">
          <div v-if="data.meta?.hex" class="flex items-center gap-2">
            <span
              class="inline-block w-4 h-4 rounded-full border border-slate-300 shrink-0"
              :style="{ background: data.meta.hex }"
            />
            <span class="text-sm font-mono">{{ data.meta.hex }}</span>
          </div>
          <span v-else class="text-slate-400">-</span>
        </template>
      </Column>
      <Column field="is_active" header="Active">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Active' : 'Inactive'"
            :severity="data.is_active ? 'success' : 'danger'"
          />
        </template>
      </Column>
      <Column field="created_at" header="Created At" sortable>
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>
      <Column header="Actions" class="w-24">
        <template #body="{ data }">
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="confirmDelete(data)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Paginator -->
    <Paginator
      :rows="store.pagination.per_page"
      :total-records="store.pagination.total"
      :first="(store.pagination.current_page - 1) * store.pagination.per_page"
      @page="onPageChange"
    />

    <ConfirmDialog />

    <!-- Create Modal -->
    <Dialog
      v-model:visible="showModal"
      header="Create Attribute Code"
      modal
      :style="{ width: '28rem' }"
    >
      <Form
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        @submit="onSubmit"
      >
        <Message
          v-if="serverError"
          severity="error"
          :closable="false"
          class="mb-4"
        >
          {{ serverError }}
        </Message>

        <div class="flex flex-col gap-4">
          <!-- Type -->
          <div class="flex flex-col gap-1">
            <label for="ac-type" class="text-sm font-medium text-slate-700">Type *</label>
            <Select
              id="ac-type"
              name="type"
              :options="store.types"
              option-label="label"
              option-value="value"
              placeholder="Select type"
              fluid
              @change="(e) => selectedTypeValue = e.value"
            />
            <Message
              v-if="$form.type?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.type.error?.message }}
            </Message>
            <small v-if="validationErrors.type" class="text-red-500">
              {{ validationErrors.type[0] }}
            </small>
          </div>

          <!-- Value -->
          <div class="flex flex-col gap-1">
            <label for="ac-value" class="text-sm font-medium text-slate-700">Value *</label>
            <InputText id="ac-value" name="value" placeholder="e.g. Red" fluid />
            <Message
              v-if="$form.value?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.value.error?.message }}
            </Message>
            <small v-if="validationErrors.value" class="text-red-500">
              {{ validationErrors.value[0] }}
            </small>
          </div>

          <!-- Code -->
          <div class="flex flex-col gap-1">
            <label for="ac-code" class="text-sm font-medium text-slate-700">Code *</label>
            <InputText id="ac-code" name="code" placeholder="e.g. RED" fluid />
            <Message
              v-if="$form.code?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.code.error?.message }}
            </Message>
            <small v-if="validationErrors.code" class="text-red-500">
              {{ validationErrors.code[0] }}
            </small>
          </div>

          <!-- Meta (color_swatch only) -->
          <div v-if="selectedDisplayType === 'color_swatch'" class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Color</label>
            <div class="flex items-center gap-3">
              <ColorPicker v-model="metaHex" />
              <span class="text-sm font-mono text-slate-600">
                {{ metaHex ? `#${metaHex}` : "No color selected" }}
              </span>
            </div>
          </div>

          <!-- Active -->
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-slate-700">Active</label>
            <ToggleSwitch v-model="isActive" />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            text
            @click="showModal = false"
          />
          <Button
            type="submit"
            label="Create"
            icon="pi pi-check"
            :loading="modalLoading"
          />
        </div>
      </Form>
    </Dialog>
  </div>
</template>
