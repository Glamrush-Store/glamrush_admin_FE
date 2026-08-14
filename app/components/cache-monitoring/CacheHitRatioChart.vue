<script setup>
import { formatCacheDate, formatCachePercent } from "~/constants/cacheMetrics";

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const width = 640;
const height = 220;
const padding = { top: 16, right: 18, bottom: 38, left: 46 };

const rows = computed(() => {
  const grouped = new Map();

  props.data.forEach((item) => {
    const key = item.timestamp;
    if (!key) return;
    const existing = grouped.get(key) || { key, hits: 0, misses: 0, label: formatCacheDate(key, { year: undefined }) };
    existing.hits += Number(item.hits) || 0;
    existing.misses += Number(item.misses) || 0;
    grouped.set(key, existing);
  });

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      ratio: item.hits + item.misses > 0 ? (item.hits / (item.hits + item.misses)) * 100 : 0,
    }))
    .sort((a, b) => new Date(a.key) - new Date(b.key));
});

const points = computed(() => {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return rows.value.map((item, index) => ({
    x: padding.left + (rows.value.length <= 1 ? usableWidth / 2 : (index / (rows.value.length - 1)) * usableWidth),
    y: padding.top + usableHeight - (item.ratio / 100) * usableHeight,
    item,
  }));
});

const linePath = computed(() => points.value.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "));
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="m-0 text-base font-semibold text-slate-900">Hit ratio trend</h2>
    <p class="m-0 mt-1 text-sm text-slate-500">Read efficiency over the selected time range.</p>

    <Skeleton v-if="props.loading" height="14rem" class="mt-4" />
    <div v-else-if="!rows.length" class="mt-4 flex h-56 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
      No ratio trend for this range.
    </div>
    <div v-else class="mt-4 overflow-x-auto">
      <svg :viewBox="`0 0 ${width} ${height}`" class="min-w-[560px]">
        <g v-for="tick in [0, 50, 100]" :key="tick">
          <line :x1="padding.left" :x2="width - padding.right" :y1="padding.top + (height - padding.top - padding.bottom) - (tick / 100) * (height - padding.top - padding.bottom)" :y2="padding.top + (height - padding.top - padding.bottom) - (tick / 100) * (height - padding.top - padding.bottom)" stroke="#e2e8f0" />
          <text :x="padding.left - 8" :y="padding.top + (height - padding.top - padding.bottom) - (tick / 100) * (height - padding.top - padding.bottom) + 4" text-anchor="end" class="fill-slate-400 text-[11px]">{{ tick }}%</text>
        </g>

        <path :d="linePath" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <g v-for="point in points" :key="point.item.key">
          <circle :cx="point.x" :cy="point.y" r="4" fill="white" stroke="#2563eb" stroke-width="2">
            <title>{{ point.item.label }}: {{ formatCachePercent(point.item.ratio) }}</title>
          </circle>
        </g>
      </svg>
    </div>
  </div>
</template>
