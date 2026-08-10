<script setup>
import { humanizeStatus, STATUS_SEVERITY } from "~/constants/dashboardAnalytics";

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] },
  statusKey: { type: String, default: "status" },
  valueKey: { type: String, default: "total" },
  loading: { type: Boolean, default: false },
});

const maxValue = computed(() => Math.max(...props.data.map((item) => Number(item[props.valueKey]) || 0), 1));
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="m-0 mb-4 text-base font-semibold text-slate-900">{{ props.title }}</h2>

    <div v-if="props.loading" class="space-y-3">
      <Skeleton v-for="index in 5" :key="index" height="1.75rem" />
    </div>
    <div v-else-if="!props.data.length" class="flex h-48 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
      No status data for this range.
    </div>
    <div v-else class="space-y-3">
      <div v-for="item in props.data" :key="item[props.statusKey]" class="grid grid-cols-[9rem_1fr_3rem] items-center gap-3">
        <Tag
          :value="humanizeStatus(item[props.statusKey])"
          :severity="STATUS_SEVERITY[item[props.statusKey]] || 'secondary'"
          class="justify-center"
        />
        <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-slate-800"
            :style="{ width: `${((Number(item[props.valueKey]) || 0) / maxValue) * 100}%` }"
          />
        </div>
        <span class="text-right text-sm font-semibold text-slate-800">{{ item[props.valueKey] || 0 }}</span>
      </div>
    </div>
  </div>
</template>
