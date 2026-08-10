<script setup>
import {
  formatDashboardCurrency,
  formatDashboardDate,
  humanizeStatus,
  STATUS_SEVERITY,
} from "~/constants/dashboardAnalytics";

const props = defineProps({
  title: { type: String, required: true },
  orders: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  currency: { type: String, default: "NGN" },
});

function customerName(order) {
  return order.customer?.name || order.customer_name || "-";
}

function customerEmail(order) {
  return order.customer?.email || order.customer_email || order.email || "-";
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="m-0 text-base font-semibold text-slate-900">{{ props.title }}</h2>
      <span class="text-xs font-medium text-slate-500">{{ props.orders.length }} shown</span>
    </div>

    <DataTable :value="props.orders" :loading="props.loading" striped-rows size="small">
      <template #empty>
        <div class="py-6 text-center text-sm text-slate-500">No orders found for this range.</div>
      </template>

      <Column field="order_number" header="Order Number">
        <template #body="{ data }">
          <NuxtLink :to="`/orders/${data.id}`" class="font-semibold text-slate-900 no-underline hover:text-primary">
            {{ data.order_number || "-" }}
          </NuxtLink>
        </template>
      </Column>
      <Column header="Customer">
        <template #body="{ data }">
          <div class="min-w-44">
            <p class="m-0 font-medium text-slate-800">{{ customerName(data) }}</p>
            <p class="m-0 text-xs text-slate-500">{{ customerEmail(data) }}</p>
          </div>
        </template>
      </Column>
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Tag :value="humanizeStatus(data.status)" :severity="STATUS_SEVERITY[data.status] || 'secondary'" />
        </template>
      </Column>
      <Column field="payment_status" header="Payment">
        <template #body="{ data }">
          <Tag :value="humanizeStatus(data.payment_status)" :severity="STATUS_SEVERITY[data.payment_status] || 'secondary'" />
        </template>
      </Column>
      <Column field="total" header="Total">
        <template #body="{ data }">{{ formatDashboardCurrency(data.total, data.currency || props.currency) }}</template>
      </Column>
      <Column field="created_at" header="Created">
        <template #body="{ data }">{{ formatDashboardDate(data.created_at) }}</template>
      </Column>
      <Column header="Actions" class="w-20">
        <template #body="{ data }">
          <NuxtLink :to="`/orders/${data.id}`">
            <Button icon="pi pi-eye" text rounded severity="info" aria-label="View order" />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
