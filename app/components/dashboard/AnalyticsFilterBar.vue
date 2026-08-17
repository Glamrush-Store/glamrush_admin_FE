<script setup>
import {
  DASHBOARD_PERIOD_OPTIONS,
  formatDashboardDate,
  formatDashboardDateInput,
} from "~/constants/dashboardAnalytics";

const props = defineProps({
  filters: { type: Object, required: true },
  lastUpdated: { type: String, default: null },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["period-change", "range-change", "refresh"]);

const dateRange = ref(null);

watch(
  () => [props.filters.from, props.filters.to],
  ([from, to]) => {
    dateRange.value = from || to ? [from ? new Date(from) : null, to ? new Date(to) : null] : null;
  },
  { immediate: true }
);

function onPeriodChange(period) {
  dateRange.value = null;
  emit("period-change", period);
}

function onDateRangeChange(value) {
  if (value && value.length === 2 && value[0] && value[1]) {
    emit("range-change", formatDashboardDateInput(value[0]), formatDashboardDateInput(value[1]));
  }
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Period</label>
          <SelectButton
            :model-value="props.filters.period"
            :options="DASHBOARD_PERIOD_OPTIONS"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            @update:model-value="onPeriodChange"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom Range</label>
          <DatePicker
            v-model="dateRange"
            selection-mode="range"
            placeholder="From - To"
            date-format="yy-mm-dd"
            class="w-full lg:w-64"
            @update:model-value="onDateRangeChange"
          />
        </div>

        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          :loading="props.loading"
          @click="emit('refresh')"
        />
      </div>

      <div class="flex min-w-56 flex-col gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</span>
        <span class="text-sm font-medium text-slate-800">{{ formatDashboardDate(props.lastUpdated) }}</span>
      </div>
    </div>
  </div>
</template>
