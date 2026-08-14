<script setup>
import { formatCacheDate, formatCacheNumber } from "~/constants/cacheMetrics";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const width = 720;
const height = 260;
const padding = { top: 18, right: 18, bottom: 42, left: 52 };

const chartRows = computed(() => {
  const grouped = new Map();

  props.data.forEach((item) => {
    const key = item.timestamp;
    if (!key) return;
    const existing = grouped.get(key) || { key, label: formatCacheDate(key, { year: undefined }), hits: 0, misses: 0 };
    existing.hits += Number(item.hits) || 0;
    existing.misses += Number(item.misses) || 0;
    grouped.set(key, existing);
  });

  return [...grouped.values()].sort((a, b) => new Date(a.key) - new Date(b.key));
});

const maxValue = computed(() => Math.max(...chartRows.value.flatMap((item) => [item.hits, item.misses]), 1));

function pointsFor(key) {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return chartRows.value.map((item, index) => {
    const x = padding.left + (chartRows.value.length <= 1 ? usableWidth / 2 : (index / (chartRows.value.length - 1)) * usableWidth);
    const y = padding.top + usableHeight - ((Number(item[key]) || 0) / maxValue.value) * usableHeight;
    return { x, y, item };
  });
}

function linePath(key) {
  return pointsFor(key).map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

const yTicks = computed(() => [0, maxValue.value / 2, maxValue.value].map((value) => ({
  value,
  y: padding.top + (height - padding.top - padding.bottom) - (value / maxValue.value) * (height - padding.top - padding.bottom),
})));

const xLabels = computed(() => {
  const points = pointsFor("hits");
  if (points.length <= 6) return points;
  const interval = Math.ceil(points.length / 6);
  return points.filter((_, index) => index % interval === 0 || index === points.length - 1);
});
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="m-0 text-base font-semibold text-slate-900">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="m-0 mt-1 text-sm text-slate-500">{{ props.subtitle }}</p>
      </div>
      <div class="flex items-center gap-4 text-xs font-semibold uppercase tracking-wide">
        <span class="flex items-center gap-1 text-emerald-700"><span class="h-2 w-2 rounded-full bg-emerald-600" /> Hits</span>
        <span class="flex items-center gap-1 text-rose-700"><span class="h-2 w-2 rounded-full bg-rose-600" /> Misses</span>
      </div>
    </div>

    <Skeleton v-if="props.loading" height="16rem" />
    <div v-else-if="!chartRows.length" class="flex h-64 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
      No cache metric series for this range.
    </div>
    <div v-else class="overflow-x-auto">
      <svg :viewBox="`0 0 ${width} ${height}`" class="min-w-[620px]">
        <g v-for="tick in yTicks" :key="tick.value">
          <line :x1="padding.left" :x2="width - padding.right" :y1="tick.y" :y2="tick.y" stroke="#e2e8f0" />
          <text :x="padding.left - 8" :y="tick.y + 4" text-anchor="end" class="fill-slate-400 text-[11px]">
            {{ formatCacheNumber(tick.value) }}
          </text>
        </g>

        <path :d="linePath('hits')" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <path :d="linePath('misses')" fill="none" stroke="#e11d48" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        <g v-for="point in pointsFor('hits')" :key="`hit-${point.item.key}`">
          <circle :cx="point.x" :cy="point.y" r="4" fill="white" stroke="#059669" stroke-width="2">
            <title>{{ point.item.label }} hits: {{ formatCacheNumber(point.item.hits) }}</title>
          </circle>
        </g>
        <g v-for="point in pointsFor('misses')" :key="`miss-${point.item.key}`">
          <circle :cx="point.x" :cy="point.y" r="4" fill="white" stroke="#e11d48" stroke-width="2">
            <title>{{ point.item.label }} misses: {{ formatCacheNumber(point.item.misses) }}</title>
          </circle>
        </g>

        <g v-for="point in xLabels" :key="`label-${point.item.key}`">
          <text :x="point.x" :y="height - 12" text-anchor="middle" class="fill-slate-500 text-[11px]">
            {{ point.item.label }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
