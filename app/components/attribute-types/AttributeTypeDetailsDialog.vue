<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  attributeType: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serverError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:visible"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const detailRows = computed(() => [
  { label: "ID", value: props.attributeType?.id ?? "-" },
  { label: "Category", value: props.attributeType?.category || "Uncategorized" },
  { label: "Value", value: props.attributeType?.value ?? "-" },
  { label: "Label", value: props.attributeType?.label ?? "-" },
  { label: "Display type", value: props.attributeType?.display_type ?? "-" },
  { label: "Created at", value: formatDate(props.attributeType?.created_at) },
  { label: "Updated at", value: formatDate(props.attributeType?.updated_at) },
]);
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Attribute Type Details"
    modal
    :style="{ width: '34rem', maxWidth: 'calc(100vw - 2rem)' }"
  >
    <div v-if="loading" class="flex items-center gap-3 py-6 text-slate-600">
      <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" />
      <span>Loading attribute type...</span>
    </div>

    <Message
      v-else-if="serverError"
      severity="error"
      :closable="false"
    >
      {{ serverError }}
    </Message>

    <div v-else class="divide-y divide-surface-200">
      <div
        v-for="row in detailRows"
        :key="row.label"
        class="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[9rem_1fr]"
      >
        <span class="text-sm font-medium text-slate-500">{{ row.label }}</span>
        <span class="break-words text-sm text-slate-900">{{ row.value }}</span>
      </div>
    </div>
  </Dialog>
</template>

