<script setup>
import { formatImportDate, importStatusSeverity, importStatusLabel, importStatusStyle } from "~/utils/productImports";
defineProps({ records: { type: Array, default: () => [] }, loading: Boolean, pagination: { type: Object, required: true } });
defineEmits(["page"]);
const counts = [
  { key: "processed_products", label: "Processed" },
  { key: "imported_products", label: "Imported" },
  { key: "failed_products", label: "Failed" },
  { key: "warning_count", label: "Warnings" },
];
</script>
<template>
  <div>
    <DataTable :value="records" :loading="loading" data-key="id" striped-rows scrollable table-style="min-width: 65rem">
      <template #empty>No import history yet.</template>
      <Column field="original_filename" header="Filename" />
      <Column header="Status"><template #body="{ data }"><Tag :value="importStatusLabel(data.status)" :severity="importStatusSeverity(data.status)" :style="importStatusStyle(data.status)" /></template></Column>
      <Column v-for="count in counts" :key="count.key" :header="count.label"><template #body="{ data }">{{ data.progress?.[count.key] ?? '-' }}</template></Column>
      <Column header="Created"><template #body="{ data }">{{ formatImportDate(data.created_at) }}</template></Column>
      <Column header="Completed"><template #body="{ data }">{{ formatImportDate(data.completed_at) }}</template></Column>
      <Column header="Actions"><template #body="{ data }"><NuxtLink :to="`/product-imports/${data.id}`"><Button icon="pi pi-eye" text aria-label="View import" v-tooltip.top="'View import'" /></NuxtLink></template></Column>
    </DataTable>
    <Paginator :rows="pagination.per_page" :total-records="pagination.total" :first="(pagination.current_page - 1) * pagination.per_page" :rows-per-page-options="[15, 25, 50]" @page="$emit('page', $event)" />
  </div>
</template>
