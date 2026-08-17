<script setup>
import { formatDashboardNumber } from "~/constants/dashboardAnalytics";

const props = defineProps({
  stock: { type: Object, default: () => ({ alerts: [] }) },
  loading: { type: Boolean, default: false },
});

const stockStats = computed(() => [
  { label: "Variants managed", value: props.stock.variants_managed },
  { label: "Variants low stock", value: props.stock.variants_low_stock },
  { label: "Variants out", value: props.stock.variants_out_of_stock },
  { label: "Products managed", value: props.stock.products_managed },
  { label: "Products low stock", value: props.stock.products_low_stock },
]);
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="m-0 text-base font-semibold text-slate-900">Low stock alerts</h2>
        <p class="m-0 mt-1 text-sm text-slate-500">
          Threshold: {{ formatDashboardNumber(props.stock.low_stock_threshold) }} units
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
        <div v-for="stat in stockStats" :key="stat.label" class="rounded-md bg-slate-50 px-3 py-2">
          <p class="m-0 text-xs text-slate-500">{{ stat.label }}</p>
          <p class="m-0 text-sm font-bold text-slate-900">{{ formatDashboardNumber(stat.value) }}</p>
        </div>
      </div>
    </div>

    <DataTable :value="props.stock.alerts || []" :loading="props.loading" striped-rows size="small">
      <template #empty>
        <div class="py-6 text-center text-sm text-slate-500">No low stock alerts.</div>
      </template>
      <Column field="name" header="Product">
        <template #body="{ data }">
          <div class="min-w-44">
            <p class="m-0 font-medium text-slate-800">{{ data.name || "-" }}</p>
            <p class="m-0 text-xs text-slate-500">{{ data.sku || "-" }}</p>
          </div>
        </template>
      </Column>
      <Column field="stock_quantity" header="Stock">
        <template #body="{ data }">{{ formatDashboardNumber(data.stock_quantity) }}</template>
      </Column>
      <Column field="reserved_quantity" header="Reserved">
        <template #body="{ data }">{{ formatDashboardNumber(data.reserved_quantity) }}</template>
      </Column>
      <Column field="available_quantity" header="Available">
        <template #body="{ data }">
          <span class="font-semibold" :class="Number(data.available_quantity) <= 0 ? 'text-red-700' : 'text-slate-800'">
            {{ formatDashboardNumber(data.available_quantity) }}
          </span>
        </template>
      </Column>
      <Column field="in_stock" header="Status">
        <template #body="{ data }">
          <Tag :value="data.in_stock ? 'In stock' : 'Out of stock'" :severity="data.in_stock ? 'success' : 'danger'" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
