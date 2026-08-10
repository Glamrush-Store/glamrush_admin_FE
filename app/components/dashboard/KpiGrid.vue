<script setup>
import { formatDashboardCurrency, formatDashboardNumber } from "~/constants/dashboardAnalytics";

const props = defineProps({
  summary: { type: Object, default: () => ({}) },
  currency: { type: String, default: "NGN" },
  loading: { type: Boolean, default: false },
});

const cards = computed(() => [
  {
    label: "Lifetime sales",
    value: formatDashboardCurrency(props.summary.lifetime_sales, props.currency),
    icon: "pi pi-wallet",
    tone: "emerald",
  },
  {
    label: "Selected period sales",
    value: formatDashboardCurrency(props.summary.period_sales, props.currency),
    icon: "pi pi-chart-line",
    tone: "indigo",
  },
  {
    label: "Period order count",
    value: formatDashboardNumber(props.summary.period_sales_count),
    icon: "pi pi-shopping-bag",
    tone: "sky",
  },
  {
    label: "Average order value",
    value: formatDashboardCurrency(props.summary.average_order_value, props.currency),
    icon: "pi pi-receipt",
    tone: "amber",
  },
  {
    label: "Completed orders",
    value: formatDashboardNumber(props.summary.completed_orders_count),
    icon: "pi pi-check-circle",
    tone: "green",
  },
  {
    label: "New customer purchases",
    value: formatDashboardNumber(props.summary.new_customer_purchases_count),
    icon: "pi pi-user-plus",
    tone: "cyan",
  },
  {
    label: "Uncompleted/unpaid orders",
    value: formatDashboardNumber(props.summary.uncompleted_or_unpaid_orders_count),
    icon: "pi pi-exclamation-circle",
    tone: "rose",
  },
  {
    label: "Pending fulfillment",
    value: formatDashboardNumber(props.summary.pending_fulfillment_count),
    icon: "pi pi-truck",
    tone: "slate",
  },
]);

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-700",
  indigo: "bg-indigo-50 text-indigo-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  cyan: "bg-cyan-50 text-cyan-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};
</script>

<template>
  <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</p>
          <Skeleton v-if="props.loading" width="8rem" height="1.75rem" class="mt-3" />
          <p v-else class="m-0 mt-2 truncate text-2xl font-bold text-slate-900">{{ card.value }}</p>
        </div>
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" :class="toneClasses[card.tone]">
          <i :class="card.icon" />
        </span>
      </div>
    </div>
  </div>
</template>
