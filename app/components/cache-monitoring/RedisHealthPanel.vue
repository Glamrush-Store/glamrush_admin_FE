<script setup>
import {
  REDIS_HEALTH_FIELDS,
  formatCacheDate,
  formatCacheNumber,
} from "~/constants/cacheMetrics";

const props = defineProps({
  status: { type: Object, default: () => ({}) },
  redis: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
});

function displayValue(key) {
  const value = props.redis?.[key];
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return formatCacheNumber(value);
  return value;
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="m-0 text-base font-semibold text-slate-900">Redis health</h2>
        <p class="m-0 mt-1 text-sm text-slate-500">Latest Redis runtime snapshot from cache metrics.</p>
      </div>
      <Tag
        :value="props.redis ? 'Reporting' : 'No snapshot'"
        :severity="props.redis ? 'success' : 'warn'"
      />
    </div>

    <Skeleton v-if="props.loading" height="18rem" />
    <div v-else>
      <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last aggregation</span>
          <p class="m-0 mt-1 text-sm font-semibold text-slate-900">{{ formatCacheDate(props.status.last_aggregation_at) }}</p>
        </div>
        <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest metric</span>
          <p class="m-0 mt-1 text-sm font-semibold text-slate-900">{{ formatCacheDate(props.status.latest_metric_at) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          v-for="field in REDIS_HEALTH_FIELDS"
          :key="field.key"
          class="rounded-md border border-slate-200 p-3"
        >
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ field.label }}</span>
          <p class="m-0 mt-1 text-sm font-bold text-slate-900">{{ displayValue(field.key) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
