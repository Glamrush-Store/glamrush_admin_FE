<script setup>
import { formatDashboardCurrency, formatDashboardNumber } from "~/constants/dashboardAnalytics";

const props = defineProps({
  title: { type: String, required: true },
  products: { type: Array, default: () => [] },
  currency: { type: String, default: "NGN" },
  loading: { type: Boolean, default: false },
});
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="m-0 mb-3 text-base font-semibold text-slate-900">{{ props.title }}</h2>
    <DataTable :value="props.products" :loading="props.loading" striped-rows size="small">
      <template #empty>
        <div class="py-6 text-center text-sm text-slate-500">No product sales data for this range.</div>
      </template>
      <Column field="name" header="Product">
        <template #body="{ data }">
          <div class="min-w-44">
            <p class="m-0 font-medium text-slate-800">{{ data.name || "-" }}</p>
            <p class="m-0 text-xs text-slate-500">{{ data.sku || "-" }}</p>
          </div>
        </template>
      </Column>
      <Column field="quantity_sold" header="Qty Sold">
        <template #body="{ data }">{{ formatDashboardNumber(data.quantity_sold) }}</template>
      </Column>
      <Column field="sales_total" header="Sales">
        <template #body="{ data }">{{ formatDashboardCurrency(data.sales_total, props.currency) }}</template>
      </Column>
    </DataTable>
  </div>
</template>
