<script setup>
import { useShipmentStore } from "~/stores/shipment";

const shipmentStore = useShipmentStore();

const orderIdInput = ref("");
let searchTimeout = null;

const statusOptions = [
  { label: "All", value: null },
  { label: "Pending", value: "pending" },
  { label: "Ready", value: "ready" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
];

const statusSeverity = {
  pending: "warn",
  ready: "info",
  shipped: "contrast",
  delivered: "success",
  failed: "danger",
};

function onOrderIdInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => shipmentStore.setFilter("order_id", val), 400);
}

function onStatusChange(val) {
  shipmentStore.setFilter("status", val);
}

function clearFilters() {
  orderIdInput.value = "";
  shipmentStore.resetFilters();
}

function onSort(event) {
  shipmentStore.setSorting(event.sortField, event.sortOrder === 1 ? "asc" : "desc");
}

function onPageChange(event) {
  shipmentStore.setPage(event.page + 1);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatPrice(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);
}

onMounted(() => shipmentStore.fetchShipments());
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Shipments</h1>
    </div>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Order ID</label>
        <InputText
          v-model="orderIdInput"
          placeholder="Search by order ID..."
          class="w-56"
          @input="onOrderIdInput(orderIdInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="shipmentStore.filters.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-40"
          @update:model-value="onStatusChange"
        />
      </div>

      <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
    </div>

    <DataTable
      :value="shipmentStore.shipments"
      :loading="shipmentStore.loading"
      lazy
      :total-records="shipmentStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <Column field="tracking_number" header="Tracking No.">
        <template #body="{ data }">{{ data.tracking_number ?? "-" }}</template>
      </Column>
      <Column field="order_id" header="Order ID" />
      <Column field="method.name" header="Method">
        <template #body="{ data }">{{ data.method?.name ?? "-" }}</template>
      </Column>
      <Column field="zone.name" header="Zone">
        <template #body="{ data }">{{ data.zone?.name ?? "-" }}</template>
      </Column>
      <Column field="carrier" header="Carrier">
        <template #body="{ data }">{{ data.carrier ?? "-" }}</template>
      </Column>
      <Column field="shipping_amount" header="Amount" sortable>
        <template #body="{ data }">{{ formatPrice(data.shipping_amount) }}</template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity[data.status] ?? 'secondary'" />
        </template>
      </Column>
      <Column field="shipped_at" header="Shipped" sortable>
        <template #body="{ data }">{{ formatDate(data.shipped_at) }}</template>
      </Column>
      <Column field="delivered_at" header="Delivered">
        <template #body="{ data }">{{ formatDate(data.delivered_at) }}</template>
      </Column>
    </DataTable>

    <Paginator
      :rows="shipmentStore.pagination.per_page"
      :total-records="shipmentStore.pagination.total"
      :first="(shipmentStore.pagination.current_page - 1) * shipmentStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
