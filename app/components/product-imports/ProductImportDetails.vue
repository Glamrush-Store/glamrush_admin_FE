<script setup>
import { formatImportDate, importProgress, importStatusLabel, importStatusSeverity, importStatusStyle } from "~/utils/productImports";
import ProductImportIssues from "./ProductImportIssues.vue";
import { buildCategoryTree, flattenCategoryTree } from "~/utils/categoryTree";
const props = defineProps({ record: { type: Object, required: true }, options: { type: Object, required: true } });
const configuration = computed(() => props.record.configuration || {});
const assignedCategoryIds = computed(() => configuration.value.category_ids || (configuration.value.category_id ? [configuration.value.category_id] : []));
const primaryCategoryId = computed(() => configuration.value.primary_category_id || configuration.value.category_id);
const categoryNames = computed(() => Object.fromEntries(flattenCategoryTree(buildCategoryTree(props.options.categories)).map((node) => [node.key, node.label])));
const progress = computed(() => props.record.progress || {});
const stats = [
  { key: "total_rows", label: "Total rows" }, { key: "total_products", label: "Total products" },
  { key: "processed_products", label: "Processed" }, { key: "imported_products", label: "Imported" },
  { key: "failed_products", label: "Failed" }, { key: "warning_count", label: "Warnings" },
];
function optionName(key, id) { return props.options[key]?.find((item) => String(item.value) === String(id))?.label || id || "-"; }
</script>
<template>
  <div class="import-details">
    <div class="flex flex-wrap items-center gap-3 mb-4"><h2 class="text-lg font-semibold break-all">{{ record.original_filename }}</h2><Tag :value="importStatusLabel(record.status)" :severity="importStatusSeverity(record.status)" :style="importStatusStyle(record.status)" /></div>
    <p class="text-sm text-slate-600 mb-2">Processed {{ progress.processed_products ?? 0 }} of {{ progress.total_products ?? 0 }} products</p>
    <ProgressBar :value="importProgress(progress)" aria-label="Products processed" />
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 py-5 border-b border-slate-200">
      <div v-for="stat in stats" :key="stat.key"><div class="text-sm text-slate-500">{{ stat.label }}</div><div class="text-2xl font-semibold">{{ progress[stat.key] ?? 0 }}</div></div>
    </div>
    <section class="py-5 border-b border-slate-200">
      <h2 class="text-lg font-semibold mb-3">Import configuration</h2>
      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div><dt class="text-slate-500">Import ID</dt><dd class="break-all">{{ record.id || '-' }}</dd></div>
        <div><dt class="text-slate-500">Vendor</dt><dd class="break-all">{{ optionName('vendors', configuration.vendor_id) }}</dd></div>
        <div><dt class="text-slate-500">Brand</dt><dd class="break-all">{{ optionName('brands', configuration.brand_id) }}</dd></div>
        <div><dt class="text-slate-500">Categories</dt><dd class="break-all"><ul v-if="assignedCategoryIds.length" class="list-none p-0 m-0"><li v-for="id in assignedCategoryIds" :key="id">{{ categoryNames[id] || id }}<span v-if="String(id) === String(primaryCategoryId)" class="font-semibold"> (Primary)</span></li></ul><span v-else>-</span></dd></div>
        <div><dt class="text-slate-500">Primary category</dt><dd class="break-all">{{ categoryNames[primaryCategoryId] || primaryCategoryId || '-' }}</dd></div>
        <div><dt class="text-slate-500">Default product status</dt><dd>{{ importStatusLabel(configuration.default_status) }}</dd></div>
        <div><dt class="text-slate-500">Image failure policy</dt><dd>{{ configuration.image_failure_policy === 'warn' ? 'Warn and continue' : importStatusLabel(configuration.image_failure_policy) }}</dd></div>
        <div><dt class="text-slate-500">Started</dt><dd>{{ formatImportDate(record.started_at) }}</dd></div>
        <div><dt class="text-slate-500">Completed</dt><dd>{{ formatImportDate(record.completed_at) }}</dd></div>
        <div><dt class="text-slate-500">Created</dt><dd>{{ formatImportDate(record.created_at) }}</dd></div>
        <div><dt class="text-slate-500">Last updated</dt><dd>{{ formatImportDate(record.updated_at) }}</dd></div>
      </dl>
    </section>
    <ProductImportIssues :issues="record.issues || []" />
  </div>
</template>

<style scoped>
.import-details {
  color: #0f172a;
}
.import-details dd,
.import-details h2,
.import-details .text-2xl {
  color: #0f172a;
}
</style>
