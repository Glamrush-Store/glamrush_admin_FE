<script setup>
import {
  CACHE_AREA_OPTIONS,
  CACHE_SERVICE_OPTIONS,
  CACHE_SORT_OPTIONS,
  formatCacheDate,
} from "~/constants/cacheMetrics";

const props = defineProps({
  filters: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  lastUpdated: { type: String, default: null },
});

const emit = defineEmits(["apply", "refresh", "reset"]);

const draft = reactive({
  service: null,
  area: null,
  sort_dir: "asc",
});
const dateRange = ref(null);

watch(
  () => props.filters,
  (filters) => {
    draft.service = filters.service || null;
    draft.area = filters.area || null;
    draft.sort_dir = filters.sort_dir || "asc";
    dateRange.value = filters.from || filters.to
      ? [filters.from ? new Date(filters.from) : null, filters.to ? new Date(filters.to) : null]
      : null;
  },
  { immediate: true, deep: true },
);

function applyFilters() {
  emit("apply", {
    service: draft.service,
    area: draft.area,
    sort_dir: draft.sort_dir,
    page: 1,
    from: dateRange.value?.[0] ? dateRange.value[0].toISOString() : null,
    to: dateRange.value?.[1] ? dateRange.value[1].toISOString() : null,
  });
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div class="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Service</label>
          <Select
            v-model="draft.service"
            :options="CACHE_SERVICE_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="All services"
            fluid
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Area</label>
          <Select
            v-model="draft.area"
            :options="CACHE_AREA_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="All areas"
            filter
            fluid
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Date range</label>
          <DatePicker
            v-model="dateRange"
            selection-mode="range"
            show-time
            hour-format="24"
            placeholder="Last 24 hours"
            date-format="yy-mm-dd"
            fluid
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
          <Select
            v-model="draft.sort_dir"
            :options="CACHE_SORT_OPTIONS"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          label="Apply"
          icon="pi pi-filter"
          :loading="props.loading"
          @click="applyFilters"
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          :loading="props.loading"
          @click="emit('refresh')"
        />
        <Button
          label="Reset"
          icon="pi pi-undo"
          severity="secondary"
          text
          @click="emit('reset')"
        />
      </div>
    </div>

    <div class="mt-3 flex items-center gap-2 text-sm text-slate-500">
      <i class="pi pi-clock text-slate-400" />
      <span>Last updated {{ formatCacheDate(props.lastUpdated) }}</span>
    </div>
  </div>
</template>
