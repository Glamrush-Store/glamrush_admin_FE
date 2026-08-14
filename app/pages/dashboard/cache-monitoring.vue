<script setup>
import {
  CACHE_METRICS_PERMISSIONS,
  formatCacheDate,
  humanizeCacheValue,
} from "~/constants/cacheMetrics";
import { ApiError } from "~/composables/apiClient";
import { useCacheMetricsStore } from "~/stores/cacheMetrics";

const store = useCacheMetricsStore();
const { can } = usePermissions();
const toast = useToast();
const flushDialogVisible = ref(false);
const flushErrors = ref({});
const flushServerError = ref("");

const metrics = computed(() => store.metrics || {});
const summary = computed(() => metrics.value.summary || {});
const status = computed(() => store.status || {});
const series = computed(() => metrics.value.series || []);
const meta = computed(() => metrics.value.meta || {});
const redis = computed(() => status.value.redis || summary.value.redis || null);
const loading = computed(() => store.loading || store.statusLoading);
const actionLoading = computed(() => loading.value || store.refreshing || store.flushing);
const canView = computed(() => can(CACHE_METRICS_PERMISSIONS.view));
const canFlush = computed(() => can(CACHE_METRICS_PERMISSIONS.update));

const activeFilterLabel = computed(() => {
  const filters = store.filters;
  const service = filters.service ? humanizeCacheValue(filters.service) : "All services";
  const area = filters.area ? humanizeCacheValue(filters.area) : "All areas";
  return `${service} | ${area} | ${formatCacheDate(filters.from)} - ${formatCacheDate(filters.to)}`;
});

async function loadCacheMetrics(overrides = {}) {
  try {
    await Promise.all([
      store.fetchStatus(),
      store.fetchMetrics(overrides),
    ]);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Cache metrics unavailable",
      detail: error.message || "Unable to load cache monitoring data",
      life: 4000,
    });
  }
}

async function applyFilters(filters) {
  await loadCacheMetrics(filters);
}

async function resetFilters() {
  try {
    await Promise.all([
      store.fetchStatus(),
      store.resetFilters(),
    ]);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Reset failed",
      detail: error.message || "Unable to reset cache monitoring filters",
      life: 4000,
    });
  }
}

async function refreshMetrics() {
  try {
    const response = await store.refreshMetrics();
    await Promise.all([
      store.fetchStatus(),
      store.fetchMetrics(),
    ]);

    toast.add({
      severity: "success",
      summary: response.message || "Cache metrics refreshed",
      detail: response.data?.output || "Cache metrics refreshed successfully.",
      life: 4500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Refresh failed",
      detail: error.message || "Unable to refresh cache metrics",
      life: 4500,
    });
  }
}

function openFlushDialog() {
  if (!canFlush.value) {
    toast.add({
      severity: "error",
      summary: "Permission denied",
      detail: "You do not have permission to flush cache.",
      life: 4500,
    });
    return;
  }

  flushErrors.value = {};
  flushServerError.value = "";
  flushDialogVisible.value = true;
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

async function flushCache(payload) {
  flushErrors.value = {};
  flushServerError.value = "";

  try {
    const response = await store.flushCache(payload);
    flushDialogVisible.value = false;

    await Promise.all([
      store.fetchStatus(),
      store.fetchMetrics(),
    ]);

    toast.add({
      severity: "success",
      summary: response.message || "Cache flushed",
      detail: `Cache flushed. Deleted ${response.data?.deleted ?? 0} keys.`,
      life: 5000,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      flushServerError.value = "You do not have permission to flush cache.";
      toast.add({
        severity: "error",
        summary: "Permission denied",
        detail: flushServerError.value,
        life: 5000,
      });
      return;
    }

    if (error instanceof ApiError && error.status === 422) {
      flushErrors.value = error.errors || {};
      flushServerError.value = getErrorMessage(error, "Unable to flush cache.");
      toast.add({
        severity: "error",
        summary: "Flush failed",
        detail: flushServerError.value,
        life: 5000,
      });
      return;
    }

    toast.add({
      severity: "error",
      summary: "Flush failed",
      detail: getErrorMessage(error, "Unable to flush cache. Please try again."),
      life: 5000,
    });
  }
}

function goToPage(page) {
  if (!page || page === store.filters.page) return;
  loadCacheMetrics({ page });
}

onMounted(() => {
  if (canView.value) {
    loadCacheMetrics();
  }
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Cache Monitoring</h1>
        <p class="m-0 mt-1 text-sm text-slate-500">{{ activeFilterLabel }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <i class="pi pi-shield text-emerald-600" />
          <span>Requires View_Dashboard</span>
        </div>
        <Button
          label="Refresh metrics"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          v-if="canView"
          :loading="store.refreshing"
          :disabled="actionLoading"
          @click="refreshMetrics"
        />
        <Button
          v-if="canFlush"
          label="Flush cache"
          icon="pi pi-trash"
          severity="danger"
          :disabled="actionLoading"
          @click="openFlushDialog"
        />
      </div>
    </div>

    <Message v-if="!canView" severity="error" :closable="false">
      You do not have permission to view cache monitoring.
    </Message>

    <template v-else>
      <Message v-if="store.error || store.statusError" severity="error" :closable="false">
        {{ store.error || store.statusError }}
      </Message>

      <CacheMonitoringCacheMetricsFilterBar
        :filters="store.filters"
        :loading="actionLoading"
        :last-updated="summary.last_aggregation_at || status.last_aggregation_at"
        @apply="applyFilters"
        @refresh="loadCacheMetrics"
        @reset="resetFilters"
      />

      <CacheMonitoringCacheSummaryCards
        :summary="summary"
        :status="status"
        :loading="loading"
      />

      <div class="grid grid-cols-1 gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
        <CacheMonitoringCacheMetricLineChart
          title="Cache hits and misses"
          subtitle="Time-series totals aggregated by metric bucket."
          :data="series"
          :loading="store.loading"
        />
        <CacheMonitoringRedisHealthPanel
          :status="status"
          :redis="redis"
          :loading="store.statusLoading"
        />
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CacheMonitoringCacheAreaBarChart
          :data="summary.by_service_area || []"
          :loading="store.loading"
        />
        <CacheMonitoringCacheHitRatioChart
          :data="series"
          :loading="store.loading"
        />
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="m-0 text-base font-semibold text-slate-900">Metric buckets</h2>
            <p class="m-0 mt-1 text-sm text-slate-500">
              Showing page {{ meta.current_page || 1 }} of {{ meta.last_page || 1 }},
              {{ meta.total || 0 }} total rows.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              label="Previous"
              icon="pi pi-chevron-left"
              severity="secondary"
              outlined
              :disabled="actionLoading || (meta.current_page || 1) <= 1"
              @click="goToPage((meta.current_page || 1) - 1)"
            />
            <Button
              label="Next"
              icon="pi pi-chevron-right"
              icon-pos="right"
              severity="secondary"
              outlined
              :disabled="actionLoading || (meta.current_page || 1) >= (meta.last_page || 1)"
              @click="goToPage((meta.current_page || 1) + 1)"
            />
          </div>
        </div>

        <DataTable
          :value="series"
          :loading="store.loading"
          class="mt-4"
          responsive-layout="scroll"
          striped-rows
        >
          <template #empty>
            <div class="py-6 text-center text-sm text-slate-500">No metric buckets found for this range.</div>
          </template>
          <Column field="timestamp" header="Bucket">
            <template #body="{ data }">{{ formatCacheDate(data.timestamp) }}</template>
          </Column>
          <Column field="service_name" header="Service">
            <template #body="{ data }">{{ humanizeCacheValue(data.service_name) }}</template>
          </Column>
          <Column field="area" header="Area">
            <template #body="{ data }">
              <Tag :value="humanizeCacheValue(data.area)" severity="secondary" />
            </template>
          </Column>
          <Column field="hits" header="Hits" />
          <Column field="misses" header="Misses" />
          <Column field="writes" header="Writes" />
          <Column field="forgets" header="Forgets" />
          <Column field="hit_ratio" header="Hit ratio">
            <template #body="{ data }">{{ Number(data.hit_ratio || 0).toFixed(2) }}%</template>
          </Column>
        </DataTable>
      </div>

      <CacheMonitoringFlushCacheDialog
        v-model:visible="flushDialogVisible"
        :loading="store.flushing"
        :errors="flushErrors"
        :server-error="flushServerError"
        @confirm="flushCache"
      />
    </template>
  </div>
</template>
