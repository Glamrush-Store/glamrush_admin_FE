<script setup>
import { useOrderStore } from "~/stores/order";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_STATUS_SEVERITY,
  PAYMENT_STATUS_SEVERITY,
} from "~/constants/orders";

const orderStore = useOrderStore();
const { can } = usePermissions();

const orderNumberInput = ref("");
const emailInput = ref("");
const dateRange = ref(null);
const lastCheckedAt = ref(null);
const pollIntervalMs = 30000;
let pollInterval = null;
let orderSearchTimeout = null;
let emailSearchTimeout = null;

function onOrderNumberInput(value) {
  clearTimeout(orderSearchTimeout);
  orderSearchTimeout = setTimeout(() => orderStore.setFilter("order_number", value), 400);
}

function onEmailInput(value) {
  clearTimeout(emailSearchTimeout);
  emailSearchTimeout = setTimeout(() => orderStore.setFilter("email", value), 400);
}

function onStatusChange(value) {
  orderStore.setFilter("status", value);
}

function formatDateValue(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

function onDateChange(value) {
  if (value && value.length === 2 && value[0] && value[1]) {
    orderStore.setFilters({
      date_from: formatDateValue(value[0]),
      date_to: formatDateValue(value[1]),
    });
    return;
  }

  if (!value || value.length === 0) {
    orderStore.setFilters({ date_from: null, date_to: null });
  }
}

function clearFilters() {
  orderNumberInput.value = "";
  emailInput.value = "";
  dateRange.value = null;
  orderStore.resetFilters();
}

function onSort(event) {
  orderStore.setSorting(event.sortField || "created_at", event.sortOrder === 1 ? "asc" : "desc");
}

function onPageChange(event) {
  orderStore.setPage(event.page + 1);
}

function formatTime(value) {
  if (!value) return "Not checked yet";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function getCustomerDisplay(order) {
  const address = order.shipping_info?.shipping_address || order.shipping_address || {};
  const shippingName = address.full_name || [
    address.first_name,
    address.last_name,
  ].filter(Boolean).join(" ");
  const customerInfo = order.customer_info || {};

  return {
    name: customerInfo.name || order.customer_name || order.customer?.name || order.user?.name || shippingName || "-",
    email: customerInfo.email || order.email || order.customer_email || order.customer?.email || address.email || "-",
    phone: customerInfo.phone || order.phone || order.customer_phone || order.customer?.phone || address.phone || "-",
  };
}

function getOrderTotal(order) {
  return order.total || order.grand_total || order.total_amount || order.amount;
}

function getOrderDate(order) {
  return order.created_at || order.ordered_at || order.placed_at;
}

function getOrderNumber(order) {
  return order.order_number || order.number || "-";
}

async function refreshOrders(options = {}) {
  await orderStore.fetchOrders(options);
  lastCheckedAt.value = new Date();
}

function pollOrders() {
  if (document.hidden) return;
  refreshOrders({ silent: true });
}

onMounted(async () => {
  await refreshOrders();
  pollInterval = setInterval(pollOrders, pollIntervalMs);
  document.addEventListener("visibilitychange", pollOrders);
});

onUnmounted(() => {
  clearTimeout(orderSearchTimeout);
  clearTimeout(emailSearchTimeout);
  clearInterval(pollInterval);
  document.removeEventListener("visibilitychange", pollOrders);
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Orders</h1>
      <div class="flex flex-wrap items-center justify-end gap-3">
        <div class="text-right text-xs text-slate-500">
          <p class="m-0">Auto-refreshes every 30s</p>
          <p class="m-0">Last checked {{ formatTime(lastCheckedAt) }}</p>
        </div>
        <Button
          icon="pi pi-refresh"
          label="Refresh"
          severity="secondary"
          outlined
          :loading="orderStore.refreshing"
          @click="refreshOrders({ silent: true })"
        />
        <NuxtLink v-if="can('Create_Order')" to="/orders/create-manual">
          <Button label="Record Offline Sale" icon="pi pi-plus" />
        </NuxtLink>
      </div>
    </div>

    <Message v-if="orderStore.error" severity="error" class="mb-4">
      {{ orderStore.error }}
    </Message>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Order Number</label>
        <InputText
          v-model="orderNumberInput"
          placeholder="Search order number..."
          class="w-56"
          @input="onOrderNumberInput(orderNumberInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Email</label>
        <InputText
          v-model="emailInput"
          placeholder="Search email..."
          class="w-64"
          @input="onEmailInput(emailInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="orderStore.filters.status"
          :options="ORDER_STATUS_FILTER_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-44"
          @update:model-value="onStatusChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Date Range</label>
        <DatePicker
          v-model="dateRange"
          selection-mode="range"
          placeholder="Select dates"
          date-format="yy-mm-dd"
          class="w-56"
          @update:model-value="onDateChange"
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

    <DataTable
      :value="orderStore.orders"
      :loading="orderStore.loading"
      lazy
      :total-records="orderStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <Column field="order_number" header="Order Number">
        <template #body="{ data }">{{ getOrderNumber(data) }}</template>
      </Column>
      <Column header="Customer">
        <template #body="{ data }">{{ getCustomerDisplay(data).name }}</template>
      </Column>
      <Column header="Email">
        <template #body="{ data }">{{ getCustomerDisplay(data).email }}</template>
      </Column>
      <Column header="Phone">
        <template #body="{ data }">{{ getCustomerDisplay(data).phone }}</template>
      </Column>
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Tag :value="data.status || '-'" :severity="ORDER_STATUS_SEVERITY[data.status] || 'secondary'" />
        </template>
      </Column>
      <Column field="payment_status" header="Payment">
        <template #body="{ data }">
          <Tag
            :value="data.payment_status || 'Not initialized'"
            :severity="PAYMENT_STATUS_SEVERITY[data.payment_status] || 'secondary'"
          />
        </template>
      </Column>
      <Column header="Total">
        <template #body="{ data }">{{ formatPrice(getOrderTotal(data)) }}</template>
      </Column>
      <Column field="created_at" header="Date" sortable>
        <template #body="{ data }">{{ formatDate(getOrderDate(data)) }}</template>
      </Column>
      <Column header="Actions" class="w-24">
        <template #body="{ data }">
          <NuxtLink :to="`/orders/${data.id}`">
            <Button icon="pi pi-eye" severity="info" text rounded />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="orderStore.pagination.per_page"
      :total-records="orderStore.pagination.total"
      :first="(orderStore.pagination.current_page - 1) * orderStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
