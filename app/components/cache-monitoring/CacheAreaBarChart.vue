<script setup>
import { formatCacheNumber, humanizeCacheValue } from "~/constants/cacheMetrics";

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const rows = computed(() => {
  const grouped = new Map();

  props.data.forEach((item) => {
    const key = item.area || "other";
    const existing = grouped.get(key) || { area: key, hits: 0, misses: 0 };
    existing.hits += Number(item.hits) || 0;
    existing.misses += Number(item.misses) || 0;
    grouped.set(key, existing);
  });

  return [...grouped.values()].sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses));
});

const maxValue = computed(() => Math.max(...rows.value.flatMap((item) => [item.hits, item.misses]), 1));
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="m-0 text-base font-semibold text-slate-900">Hits vs misses by area</h2>
        <p class="m-0 mt-1 text-sm text-slate-500">Grouped totals across selected services.</p>
      </div>
      <div class="flex items-center gap-4 text-xs font-semibold uppercase tracking-wide">
        <span class="flex items-center gap-1 text-emerald-700"><span class="h-2 w-2 rounded-full bg-emerald-600" /> Hits</span>
        <span class="flex items-center gap-1 text-rose-700"><span class="h-2 w-2 rounded-full bg-rose-600" /> Misses</span>
      </div>
    </div>

    <div v-if="props.loading" class="space-y-3">
      <Skeleton v-for="index in 6" :key="index" height="2rem" />
    </div>
    <div v-else-if="!rows.length" class="flex h-64 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
      No area breakdown for this range.
    </div>
    <div v-else class="space-y-4">
      <div v-for="row in rows" :key="row.area" class="grid grid-cols-[7rem_1fr] items-center gap-3">
        <span class="truncate text-sm font-semibold text-slate-700">{{ humanizeCacheValue(row.area) }}</span>
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-emerald-600" :style="{ width: `${(row.hits / maxValue) * 100}%` }" />
            </div>
            <span class="w-16 text-right text-xs font-semibold text-slate-700">{{ formatCacheNumber(row.hits) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-rose-600" :style="{ width: `${(row.misses / maxValue) * 100}%` }" />
            </div>
            <span class="w-16 text-right text-xs font-semibold text-slate-700">{{ formatCacheNumber(row.misses) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
