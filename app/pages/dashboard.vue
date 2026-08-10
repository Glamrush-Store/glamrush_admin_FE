<script setup>
import {
  DASHBOARD_PERMISSIONS,
  formatDashboardCurrency,
  formatDashboardDate,
} from "~/constants/dashboardAnalytics";
import { useDashboardAnalyticsStore } from "~/stores/dashboardAnalytics";

const store = useDashboardAnalyticsStore();
const { can } = usePermissions();
const toast = useToast();

const analytics = computed(() => store.analytics || {});
const period = computed(() => analytics.value.period || {});
const summary = computed(() => analytics.value.summary || {});
const charts = computed(() => analytics.value.charts || {});
const breakdowns = computed(() => analytics.value.breakdowns || {});
const stock = computed(() => analytics.value.stock || { alerts: [] });
const snapshot = computed(() => analytics.value.snapshot || {});
const currency = computed(() => analytics.value.currency || "NGN");

const rangeLabel = computed(() => {
  if (!period.value.starts_at || !period.value.ends_at) return "Default week analytics";
  return `${formatDashboardDate(period.value.starts_at, { hour: undefined, minute: undefined })} - ${formatDashboardDate(period.value.ends_at, { hour: undefined, minute: undefined })}`;
});

async function loadAnalytics(overrides) {
  try {
    await store.fetchAnalytics(overrides);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Dashboard unavailable",
      detail: error.message || "Unable to load dashboard analytics",
      life: 4000,
    });
  }
}

function onPeriodChange(periodKey) {
  loadAnalytics({ period: periodKey, from: null, to: null });
}

function onRangeChange(from, to) {
  loadAnalytics({ from, to });
}

onMounted(() => {
  if (can(DASHBOARD_PERMISSIONS.view)) loadAnalytics();
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Dashboard Analytics</h1>
        <p class="m-0 mt-1 text-sm text-slate-500">{{ rangeLabel }}</p>
      </div>
      <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <i class="pi pi-database text-slate-400" />
        <span>Cached {{ snapshot.response_cached_for_seconds || 300 }}s</span>
      </div>
    </div>

    <Message v-if="!can(DASHBOARD_PERMISSIONS.view)" severity="error" :closable="false">
      You do not have permission to view dashboard analytics.
    </Message>

    <template v-else>
      <Message v-if="store.error" severity="error" :closable="false">
        {{ store.error }}
      </Message>

      <DashboardAnalyticsFilterBar
        :filters="store.filters"
        :last-updated="snapshot.aggregated_at"
        :loading="store.loading"
        @period-change="onPeriodChange"
        @range-change="onRangeChange"
        @refresh="loadAnalytics"
      />

      <DashboardKpiGrid :summary="summary" :currency="currency" :loading="store.loading" />

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashboardLineAreaChart
          title="Completed sales"
          subtitle="Sales value with order count in point tooltips"
          :data="charts.completed_sales || []"
          value-key="sales"
          secondary-key="orders_count"
          secondary-label="Orders"
          :value-formatter="(value) => formatDashboardCurrency(value, currency)"
          :loading="store.loading"
          color="#047857"
        />
        <DashboardLineAreaChart
          title="New customer purchases"
          subtitle="First purchases from newly converted customers"
          :data="charts.new_customer_purchases || []"
          value-key="customers_count"
          secondary-key="orders_count"
          secondary-label="Orders"
          :value-formatter="(value) => `${Number(value || 0).toLocaleString('en-NG')}`"
          :loading="store.loading"
          color="#2563eb"
        />
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashboardBreakdownChart
          title="Orders by status"
          :data="breakdowns.orders_by_status || []"
          status-key="status"
          value-key="total"
          :loading="store.loading"
        />
        <DashboardBreakdownChart
          title="Payments by status"
          :data="breakdowns.payments_by_status || []"
          status-key="status"
          value-key="total"
          :loading="store.loading"
        />
      </div>

      <DashboardOrdersTable
        title="Recent orders"
        :orders="analytics.recent_orders || []"
        :currency="currency"
        :loading="store.loading"
      />

      <DashboardOrdersTable
        title="Uncompleted or unpaid orders"
        :orders="analytics.uncompleted_or_unpaid_orders || []"
        :currency="currency"
        :loading="store.loading"
      />

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashboardProductSalesTable
          title="Most sold products"
          :products="analytics.most_sold_products || []"
          :currency="currency"
          :loading="store.loading"
        />
        <DashboardProductSalesTable
          title="Least sold products"
          :products="analytics.least_sold_products || []"
          :currency="currency"
          :loading="store.loading"
        />
      </div>

      <DashboardStockAlertsTable :stock="stock" :loading="store.loading" />
    </template>
  </div>
</template>
