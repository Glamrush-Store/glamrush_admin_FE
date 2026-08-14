<script setup>
import {
  formatCacheDate,
  formatCacheNumber,
  formatCachePercent,
} from "~/constants/cacheMetrics";

const props = defineProps({
  summary: { type: Object, default: () => ({}) },
  status: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
});

const cards = computed(() => [
  {
    label: "Total hits",
    value: formatCacheNumber(props.summary.hits),
    icon: "pi pi-check-circle",
    tone: "emerald",
  },
  {
    label: "Total misses",
    value: formatCacheNumber(props.summary.misses),
    icon: "pi pi-times-circle",
    tone: "rose",
  },
  {
    label: "Hit ratio",
    value: formatCachePercent(props.summary.hit_ratio),
    icon: "pi pi-percentage",
    tone: "blue",
  },
  {
    label: "Writes",
    value: formatCacheNumber(props.summary.writes),
    icon: "pi pi-save",
    tone: "amber",
  },
  {
    label: "Forgets",
    value: formatCacheNumber(props.summary.forgets),
    icon: "pi pi-trash",
    tone: "slate",
  },
  {
    label: "Last aggregation",
    value: formatCacheDate(props.summary.last_aggregation_at || props.status.last_aggregation_at),
    icon: "pi pi-clock",
    tone: "violet",
  },
  {
    label: "Latest metric",
    value: formatCacheDate(props.status.latest_metric_at),
    icon: "pi pi-chart-line",
    tone: "cyan",
  },
]);

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
  violet: "bg-violet-50 text-violet-700",
  cyan: "bg-cyan-50 text-cyan-700",
};
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <Skeleton v-if="props.loading" height="4.5rem" />
      <template v-else>
        <div class="mb-3 flex items-center justify-between gap-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</span>
          <span class="flex h-8 w-8 items-center justify-center rounded-md" :class="toneClasses[card.tone]">
            <i :class="card.icon" />
          </span>
        </div>
        <p class="m-0 text-xl font-bold text-slate-900">{{ card.value }}</p>
      </template>
    </div>
  </div>
</template>
