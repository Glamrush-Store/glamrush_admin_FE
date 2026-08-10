<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  data: { type: Array, default: () => [] },
  valueKey: { type: String, required: true },
  secondaryKey: { type: String, default: null },
  secondaryLabel: { type: String, default: "" },
  valueFormatter: { type: Function, default: (value) => value },
  loading: { type: Boolean, default: false },
  color: { type: String, default: "#0f766e" },
});

const width = 640;
const height = 220;
const padding = { top: 18, right: 18, bottom: 38, left: 46 };

const points = computed(() => {
  const items = props.data || [];
  const maxValue = Math.max(...items.map((item) => Number(item[props.valueKey]) || 0), 1);
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return items.map((item, index) => {
    const x = padding.left + (items.length <= 1 ? usableWidth / 2 : (index / (items.length - 1)) * usableWidth);
    const y = padding.top + usableHeight - ((Number(item[props.valueKey]) || 0) / maxValue) * usableHeight;
    return { x, y, item };
  });
});

const linePath = computed(() => points.value.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "));

const areaPath = computed(() => {
  if (!points.value.length) return "";
  const baseline = height - padding.bottom;
  return `${linePath.value} L ${points.value[points.value.length - 1].x} ${baseline} L ${points.value[0].x} ${baseline} Z`;
});

const yTicks = computed(() => {
  const maxValue = Math.max(...props.data.map((item) => Number(item[props.valueKey]) || 0), 1);
  return [0, maxValue / 2, maxValue].map((value) => ({
    value,
    y: padding.top + (height - padding.top - padding.bottom) - (value / maxValue) * (height - padding.top - padding.bottom),
  }));
});

const xLabels = computed(() => {
  if (points.value.length <= 6) return points.value;
  const interval = Math.ceil(points.value.length / 6);
  return points.value.filter((_, index) => index % interval === 0 || index === points.value.length - 1);
});
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 class="m-0 text-base font-semibold text-slate-900">{{ props.title }}</h2>
        <p v-if="props.subtitle" class="m-0 mt-1 text-sm text-slate-500">{{ props.subtitle }}</p>
      </div>
    </div>

    <Skeleton v-if="props.loading" height="14rem" />
    <div v-else-if="!props.data.length" class="flex h-56 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
      No chart data for this range.
    </div>
    <div v-else class="overflow-x-auto">
      <svg :viewBox="`0 0 ${width} ${height}`" class="min-w-[560px]">
        <defs>
          <linearGradient :id="`${props.valueKey}-gradient`" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" :stop-color="props.color" stop-opacity="0.22" />
            <stop offset="100%" :stop-color="props.color" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <g v-for="tick in yTicks" :key="tick.value">
          <line :x1="padding.left" :x2="width - padding.right" :y1="tick.y" :y2="tick.y" stroke="#e2e8f0" stroke-width="1" />
          <text :x="padding.left - 8" :y="tick.y + 4" text-anchor="end" class="fill-slate-400 text-[11px]">
            {{ props.valueFormatter(tick.value) }}
          </text>
        </g>

        <path :d="areaPath" :fill="`url(#${props.valueKey}-gradient)`" />
        <path :d="linePath" fill="none" :stroke="props.color" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        <g v-for="point in points" :key="point.item.key || point.item.label">
          <circle :cx="point.x" :cy="point.y" r="4" fill="white" :stroke="props.color" stroke-width="2">
            <title>
              {{ point.item.label }}: {{ props.valueFormatter(point.item[props.valueKey]) }}{{ props.secondaryKey ? `, ${props.secondaryLabel}: ${point.item[props.secondaryKey] || 0}` : "" }}
            </title>
          </circle>
        </g>

        <g v-for="point in xLabels" :key="`label-${point.item.key || point.item.label}`">
          <text :x="point.x" :y="height - 12" text-anchor="middle" class="fill-slate-500 text-[11px]">
            {{ point.item.label }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
