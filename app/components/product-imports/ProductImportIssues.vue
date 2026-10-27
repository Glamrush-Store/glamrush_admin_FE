<script setup>
import { computed, shallowRef } from "vue";
import { issueRows, issueText, importStatusStyle } from "~/utils/productImports";
const props = defineProps({ issues: { type: Array, default: () => [] } });
const severity = shallowRef("all");
const filters = [{ label: "All issues", value: "all" }, { label: "Errors", value: "error" }, { label: "Warnings", value: "warning" }];
const filtered = computed(() => props.issues.filter((issue) => severity.value === "all" || issue.severity === severity.value || (severity.value === "warning" && issue.severity === "warn")));
</script>
<template>
  <section class="import-issues-section mt-6">
    <div class="flex flex-wrap justify-between gap-3 items-center mb-3"><h2 class="text-lg font-semibold">Import issues</h2><SelectButton v-model="severity" :options="filters" option-label="label" option-value="value" :allow-empty="false" aria-label="Issue severity" /></div>
    <DataTable class="import-issues" :value="filtered" scrollable table-style="min-width: 52rem; width: 100%; table-layout: fixed" :paginator="filtered.length > 25" :rows="25">
      <template #empty>No issues to display.</template>
      <Column header="Severity" style="width: 12%"><template #body="{ data }"><Tag :severity="data.severity === 'error' ? 'danger' : 'warn'" :value="issueText(data.severity)" :style="importStatusStyle(data.severity === 'error' ? 'failed' : 'completed_with_warnings')" /></template></Column>
      <Column header="Product key" style="width: 10%"><template #body="{ data }">{{ issueText(data.product_key) }}</template></Column>
      <Column header="CSV rows" style="width: 10%"><template #body="{ data }">{{ issueRows(data) }}</template></Column>
      <Column header="Field" style="width: 12%"><template #body="{ data }">{{ issueText(data.field) }}</template></Column>
      <Column header="Rejected value" style="width: 23%"><template #body="{ data }"><span>{{ issueText(data.value) }}</span></template></Column>
      <Column header="Message" style="width: 33%"><template #body="{ data }"><span :style="{ color: data.severity === 'error' ? '#f87171' : '#fbbf24' }">{{ issueText(data.message) }}</span><pre v-if="data.errors && Object.keys(data.errors).length" class="whitespace-pre-wrap text-xs mt-1">{{ issueText(data.errors) }}</pre></template></Column>
    </DataTable>
  </section>
</template>

<style scoped>
.import-issues-section > div > h2 {
  color: #0f172a;
}
.import-issues :deep(td) {
  vertical-align: top;
  white-space: normal;
  overflow-wrap: anywhere;
}
.import-issues :deep(.p-tag) {
  white-space: nowrap;
}
</style>
