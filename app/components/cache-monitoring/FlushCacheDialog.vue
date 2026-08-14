<script setup>
import { CACHE_FLUSH_SERVICE_OPTIONS } from "~/constants/cacheMetrics";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  serverError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:visible", "confirm"]);

const selectedService = ref("backend_service");
const includeMetrics = ref(false);
const confirmed = ref(false);

const serviceError = computed(() => {
  const error = props.errors?.service;
  return Array.isArray(error) ? error[0] : error;
});

const includeMetricsError = computed(() => {
  const error = props.errors?.include_metrics;
  return Array.isArray(error) ? error[0] : error;
});

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      selectedService.value = "backend_service";
      includeMetrics.value = false;
      confirmed.value = false;
    }
  }
);

function close() {
  if (!props.loading) {
    emit("update:visible", false);
  }
}

function confirmFlush() {
  if (!confirmed.value || props.loading) return;

  emit("confirm", {
    service: selectedService.value,
    include_metrics: includeMetrics.value,
    confirm: true,
  });
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Flush cache"
    class="w-[min(94vw,34rem)]"
    :closable="!loading"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <Message severity="warn" :closable="false">
        This will delete cached data and may temporarily slow down the storefront or admin while cache warms again.
      </Message>

      <Message v-if="serverError" severity="error" :closable="false">
        {{ serverError }}
      </Message>

      <div class="space-y-2">
        <label for="cache-flush-service" class="block text-sm font-medium text-slate-700">
          Service
        </label>
        <Select
          id="cache-flush-service"
          v-model="selectedService"
          :options="CACHE_FLUSH_SERVICE_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
          :disabled="loading"
        />
        <small v-if="serviceError" class="text-red-300">{{ serviceError }}</small>
      </div>

      <div class="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
        <label class="flex cursor-pointer items-start gap-3 text-sm text-slate-100">
          <Checkbox
            v-model="includeMetrics"
            binary
            :disabled="loading"
            input-id="cache-flush-include-metrics"
          />
          <span>
            Also delete cache monitoring metric keys
            <span class="mt-1 block text-xs text-slate-400">
              Leave this unchecked to preserve monitoring history while clearing application cache.
            </span>
          </span>
        </label>
        <small v-if="includeMetricsError" class="mt-2 block text-red-300">{{ includeMetricsError }}</small>
      </div>

      <div class="rounded-lg border border-red-500/40 bg-red-950/30 p-3">
        <label class="flex cursor-pointer items-start gap-3 text-sm font-medium text-white">
          <Checkbox
            v-model="confirmed"
            binary
            :disabled="loading"
            input-id="cache-flush-confirmed"
          />
          <span>I understand this will delete cached data</span>
        </label>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="loading"
          @click="close"
        />
        <Button
          label="Flush cache"
          icon="pi pi-trash"
          severity="danger"
          :loading="loading"
          :disabled="!confirmed || loading"
          @click="confirmFlush"
        />
      </div>
    </template>
  </Dialog>
</template>
