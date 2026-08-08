<script setup>
import { ApiError } from "~/composables/apiClient";
import { useToast } from "primevue/usetoast";
import {
  DISCOUNT_ACTIVE_OPTIONS,
  DISCOUNT_STATE_OPTIONS,
  DISCOUNT_STATE_SEVERITY,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPE_OPTIONS,
} from "~/constants/discountCodes";
import { useDiscountCodeStore } from "~/stores/discountCode";

const discountStore = useDiscountCodeStore();
const toast = useToast();

const searchInput = ref("");
const startsAtRange = ref(null);
const endsAtRange = ref(null);
const duplicateDialogVisible = ref(false);
const duplicateSource = ref(null);
const duplicateCode = ref("");
const duplicateError = ref("");
let searchTimeout = null;

function onSearchInput(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => discountStore.setFilter("search", value), 400);
}

function formatDateForApi(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

function onDateRangeChange(keyFrom, keyTo, value) {
  if (value && value.length === 2 && value[0] && value[1]) {
    discountStore.setFilters({
      [keyFrom]: formatDateForApi(value[0]),
      [keyTo]: formatDateForApi(value[1]),
    });
    return;
  }

  if (!value || value.length === 0) {
    discountStore.setFilters({ [keyFrom]: null, [keyTo]: null });
  }
}

function clearFilters() {
  searchInput.value = "";
  startsAtRange.value = null;
  endsAtRange.value = null;
  discountStore.resetFilters();
}

function onSort(event) {
  discountStore.setSorting(event.sortField || "created_at", event.sortOrder === 1 ? "asc" : "desc");
}

function onPageChange(event) {
  discountStore.setPage(event.page + 1);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatValue(code) {
  if (code.type === "free_shipping") return "Free Shipping";
  if (code.type === "percentage") return `${Number(code.value || 0)}%`;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: code.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(Number(code.value || 0));
}

async function toggleActive(code) {
  try {
    if (code.is_active) {
      await discountStore.deactivateDiscountCode(code.id);
      toast.add({ severity: "success", summary: "Discount disabled", life: 3000 });
    } else {
      await discountStore.activateDiscountCode(code.id);
      toast.add({ severity: "success", summary: "Discount enabled", life: 3000 });
    }
    await discountStore.fetchDiscountCodes();
  } catch (e) {
    toast.add({ severity: "error", summary: "Status update failed", detail: e.message, life: 4000 });
  }
}

function openDuplicateDialog(code) {
  duplicateSource.value = code;
  duplicateCode.value = `${code.code}_COPY`;
  duplicateError.value = "";
  duplicateDialogVisible.value = true;
}

async function duplicateDiscountCode() {
  duplicateError.value = "";
  if (!duplicateSource.value || !duplicateCode.value) {
    duplicateError.value = "Enter a new discount code.";
    return;
  }

  try {
    const response = await discountStore.duplicateDiscountCode(duplicateSource.value.id, duplicateCode.value.toUpperCase().trim());
    duplicateDialogVisible.value = false;
    toast.add({ severity: "success", summary: "Discount duplicated", life: 3000 });
    await navigateTo(`/discount-codes/${response.data.id}`);
  } catch (e) {
    duplicateError.value = e instanceof ApiError ? e.message : "Unable to duplicate discount code";
  }
}

onMounted(() => {
  discountStore.fetchDiscountCodes();
});

onBeforeUnmount(() => {
  clearTimeout(searchTimeout);
});
</script>

<template>
  <div>
    <Toast />

    <Dialog v-model:visible="duplicateDialogVisible" modal header="Duplicate Discount Code" class="w-full max-w-md">
      <div class="flex flex-col gap-3">
        <Message v-if="duplicateError" severity="error" :closable="false">
          {{ duplicateError }}
        </Message>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">New Code</label>
          <InputText v-model="duplicateCode" placeholder="WELCOME10_COPY" autofocus fluid />
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancel" severity="secondary" text @click="duplicateDialogVisible = false" />
          <Button label="Duplicate" icon="pi pi-copy" :loading="discountStore.actionLoading" @click="duplicateDiscountCode" />
        </div>
      </div>
    </Dialog>

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Discount Codes</h1>
      <NuxtLink to="/discount-codes/create">
        <Button label="Add Discount" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <Message v-if="discountStore.error" severity="error" class="mb-4">
      {{ discountStore.error }}
    </Message>

    <div class="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Search</label>
          <InputText v-model="searchInput" placeholder="Code, name, description..." @input="onSearchInput(searchInput)" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Type</label>
          <Select
            :model-value="discountStore.filters.type"
            :options="[{ label: 'All Types', value: null }, ...DISCOUNT_TYPE_OPTIONS]"
            option-label="label"
            option-value="value"
            @update:model-value="discountStore.setFilter('type', $event)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">State</label>
          <Select
            :model-value="discountStore.filters.state"
            :options="DISCOUNT_STATE_OPTIONS"
            option-label="label"
            option-value="value"
            @update:model-value="discountStore.setFilter('state', $event)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Enabled</label>
          <Select
            :model-value="discountStore.filters.is_active"
            :options="DISCOUNT_ACTIVE_OPTIONS"
            option-label="label"
            option-value="value"
            @update:model-value="discountStore.setFilter('is_active', $event)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Starts At</label>
          <DatePicker
            v-model="startsAtRange"
            selection-mode="range"
            placeholder="Start range"
            date-format="yy-mm-dd"
            @update:model-value="onDateRangeChange('starts_at_from', 'starts_at_to', $event)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Ends At</label>
          <DatePicker
            v-model="endsAtRange"
            selection-mode="range"
            placeholder="End range"
            date-format="yy-mm-dd"
            @update:model-value="onDateRangeChange('ends_at_from', 'ends_at_to', $event)"
          />
        </div>

        <div class="flex items-end gap-2">
          <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
          <Button icon="pi pi-refresh" severity="secondary" text :loading="discountStore.loading" @click="discountStore.fetchDiscountCodes" />
        </div>
      </div>
    </div>

    <DataTable
      :value="discountStore.discountCodes"
      :loading="discountStore.loading"
      lazy
      :total-records="discountStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <div>
            <p class="font-semibold text-slate-900 m-0">{{ data.code }}</p>
            <p class="text-sm text-slate-500 m-0">{{ data.name }}</p>
          </div>
        </template>
      </Column>
      <Column field="type" header="Type" sortable>
        <template #body="{ data }">{{ DISCOUNT_TYPE_LABELS[data.type] || data.type }}</template>
      </Column>
      <Column field="value" header="Value" sortable>
        <template #body="{ data }">{{ formatValue(data) }}</template>
      </Column>
      <Column field="state" header="State">
        <template #body="{ data }">
          <Tag :value="data.state || '-'" :severity="DISCOUNT_STATE_SEVERITY[data.state] || 'secondary'" />
        </template>
      </Column>
      <Column field="is_active" header="Enabled" sortable>
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Enabled' : 'Disabled'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column field="starts_at" header="Starts" sortable>
        <template #body="{ data }">{{ formatDate(data.starts_at) }}</template>
      </Column>
      <Column field="ends_at" header="Ends" sortable>
        <template #body="{ data }">{{ formatDate(data.ends_at) }}</template>
      </Column>
      <Column header="Actions" class="w-44">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <NuxtLink :to="`/discount-codes/${data.id}`">
              <Button icon="pi pi-eye" severity="info" text rounded />
            </NuxtLink>
            <Button
              :icon="data.is_active ? 'pi pi-pause' : 'pi pi-play'"
              :severity="data.is_active ? 'warning' : 'success'"
              text
              rounded
              :loading="discountStore.actionLoading"
              @click="toggleActive(data)"
            />
            <Button icon="pi pi-copy" severity="secondary" text rounded @click="openDuplicateDialog(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="discountStore.pagination.per_page"
      :total-records="discountStore.pagination.total"
      :first="(discountStore.pagination.current_page - 1) * discountStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
