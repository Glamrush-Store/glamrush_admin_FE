<script setup>
import { useShippingRateStore } from "~/stores/shippingRate";
import { ApiError } from "~/composables/apiClient";

const rateStore = useShippingRateStore();
const confirm = useConfirm();
const toast = useToast();

const rateTypeOptions = [
  { label: "All", value: null },
  { label: "Flat", value: "flat" },
  { label: "Order Total", value: "order_total" },
  { label: "Weight", value: "weight" },
];

const isActiveOptions = [
  { label: "All", value: null },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 0 },
];

function clearFilters() {
  rateStore.resetFilters();
}

function onSort(event) {
  rateStore.setSorting(event.sortField, event.sortOrder === 1 ? "asc" : "desc");
}

function onPageChange(event) {
  rateStore.setPage(event.page + 1);
}

function formatPrice(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);
}

function confirmDelete(rate) {
  confirm.require({
    message: `Delete rate for ${rate.zone?.name} / ${rate.method?.name}?`,
    header: "Delete Rate",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await rateStore.deleteRate(rate.id);
        toast.add({ severity: "success", summary: "Deleted", detail: "Rate has been deleted", life: 3000 });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Failed to delete rate";
        toast.add({ severity: "error", summary: "Error", detail: msg, life: 4000 });
      }
    },
  });
}

onMounted(() => rateStore.fetchRates());
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Shipping Rates</h1>
      <NuxtLink to="/shipping/rates/create">
        <Button label="Add New Rate" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Rate Type</label>
        <Select
          :model-value="rateStore.filters.rate_type"
          :options="rateTypeOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-40"
          @update:model-value="rateStore.setFilter('rate_type', $event)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="rateStore.filters.is_active"
          :options="isActiveOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-36"
          @update:model-value="rateStore.setFilter('is_active', $event)"
        />
      </div>

      <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
    </div>

    <DataTable
      :value="rateStore.rates"
      :loading="rateStore.loading"
      lazy
      :total-records="rateStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <Column field="zone.name" header="Zone">
        <template #body="{ data }">{{ data.zone?.name ?? "-" }}</template>
      </Column>
      <Column field="method.name" header="Method">
        <template #body="{ data }">{{ data.method?.name ?? "-" }}</template>
      </Column>
      <Column field="rate_type" header="Type">
        <template #body="{ data }">
          <Tag :value="data.rate_type" severity="info" />
        </template>
      </Column>
      <Column field="amount" header="Amount" sortable>
        <template #body="{ data }">{{ formatPrice(data.amount) }}</template>
      </Column>
      <Column field="free_over_amount" header="Free Over">
        <template #body="{ data }">{{ data.free_over_amount ? formatPrice(data.free_over_amount) : "-" }}</template>
      </Column>
      <Column header="Est. Days">
        <template #body="{ data }">
          {{ data.estimated_days_min }}–{{ data.estimated_days_max }} days
        </template>
      </Column>
      <Column field="is_active" header="Status">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Actions" class="w-28">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <NuxtLink :to="`/shipping/rates/${data.id}/edit`">
              <Button icon="pi pi-pencil" severity="secondary" text rounded />
            </NuxtLink>
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="rateStore.pagination.per_page"
      :total-records="rateStore.pagination.total"
      :first="(rateStore.pagination.current_page - 1) * rateStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
