<script setup>
import { Form, FormField } from "@primevue/forms";
import { yupResolver } from "@primevue/forms/resolvers/yup";
import CategoryTreeMultiSelect from "~/components/products/CategoryTreeMultiSelect.vue";
import { buildCategoryTree, flattenCategoryTree } from "~/utils/categoryTree";
import { productImportSchema, csvFileError, IMPORT_STATUS_OPTIONS, IMPORT_IMAGE_POLICIES, importStatusLabel } from "~/utils/productImports";

const props = defineProps({ options: { type: Object, required: true }, loading: Boolean, optionsLoading: Boolean, errors: { type: Object, default: () => ({}) } });
const emit = defineEmits(["submit"]);
const resolver = yupResolver(productImportSchema);
const initialValues = { file: null, vendor_id: "", brand_id: "", category_ids: [], primary_category_id: "", default_status: "draft", image_failure_policy: "warn" };
const formRef = useTemplateRef("importForm");
const categoryTree = computed(() => buildCategoryTree(props.options.categories));
const categoryChoices = computed(() => flattenCategoryTree(categoryTree.value).map((node) => ({ label: node.label, value: node.key })));
function selectedCategoryChoices(ids = []) { return categoryChoices.value.filter((item) => ids.includes(item.value)); }
function updateCategories(ids, field, primaryId) {
  field.onChange({ value: ids });
  formRef.value.setFieldValue("primary_category_id", ids.includes(primaryId) ? primaryId : ids[0] || "");
}
const file = shallowRef(null);
const fileError = shallowRef("");
const dragging = shallowRef(false);
const csvInput = useTemplateRef("csvInput");
const fields = computed(() => [
  { name: "vendor_id", label: "Vendor", options: props.options.vendors },
  { name: "brand_id", label: "Brand", options: props.options.brands },
  { name: "default_status", label: "Default status", options: IMPORT_STATUS_OPTIONS.map((value) => ({ label: importStatusLabel(value), value })) },
  { name: "image_failure_policy", label: "Image failure policy", options: IMPORT_IMAGE_POLICIES.map((value) => ({ label: value === "warn" ? "Warn and continue" : "Fail product", value })) },
]);
function backendError(name) {
  return Object.entries(props.errors).filter(([key]) => key === name || key.startsWith(`${name}.`)).flatMap(([, value]) => Array.isArray(value) ? value : [value]).filter(Boolean).join(" ");
}
function selectFile(files, field) {
  if (props.loading) return;
  dragging.value = false;
  const selected = files?.[0] || null;
  fileError.value = csvFileError(selected);
  file.value = fileError.value ? null : selected;
  field.onChange({ target: { value: file.value } });
}
function removeFile(field) {
  file.value = null;
  fileError.value = "";
  if (csvInput.value) csvInput.value.value = "";
  field.onChange({ target: { value: null } });
}
function submit({ valid, values }) {
  if (valid && !props.loading) emit("submit", values);
}
</script>

<template>
  <Form ref="importForm" v-slot="$form" :initial-values="initialValues" :resolver="resolver" :validate-on-mount="true" @submit="submit" class="flex flex-col gap-5">
    <p class="text-sm text-slate-600">Vendor, brand, and selected categories apply to every product in this CSV.</p>
    <FormField v-slot="$field" name="file">
      <div class="border-2 border-dashed rounded-lg p-5 flex flex-col gap-3" :class="dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'" @dragover.prevent="dragging = !loading" @dragleave.prevent="dragging = false" @drop.prevent="selectFile($event.dataTransfer.files, $field)">
        <label for="import-csv" class="font-medium"><i class="pi pi-upload mr-2" aria-hidden="true" />CSV file (maximum 10 MB)</label>
        <input id="import-csv" ref="csvInput" type="file" accept=".csv,text/csv" :disabled="loading" class="max-w-full text-sm focus-visible:outline focus-visible:outline-2" @change="selectFile($event.target.files, $field)" />
        <div v-if="file" class="flex items-center justify-between gap-3 min-w-0">
          <span class="text-sm break-all">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</span>
          <Button type="button" icon="pi pi-times" aria-label="Remove CSV" v-tooltip.top="'Remove CSV'" severity="secondary" text :disabled="loading" @click="removeFile($field)" />
        </div>
      </div>
      <Message v-if="fileError || backendError('file') || $field.invalid" severity="error" size="small" variant="simple">{{ backendError('file') || fileError || $field.error?.message }}</Message>
    </FormField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="field in fields" :key="field.name" class="flex flex-col gap-1 min-w-0">
        <label :for="`import-${field.name}`" class="text-sm font-medium">{{ field.label }}</label>
        <Select :input-id="`import-${field.name}`" :aria-label="field.label" :name="field.name" :options="field.options" option-label="label" option-value="value" :filter="field.name.endsWith('_id')" :loading="field.name.endsWith('_id') && optionsLoading" :disabled="loading || optionsLoading" :placeholder="`Select ${field.label.toLowerCase()}`" fluid />
        <Message v-if="backendError(field.name) || $form[field.name]?.invalid" severity="error" size="small" variant="simple">{{ backendError(field.name) || $form[field.name]?.error?.message }}</Message>
      </div>
    </div>
    <FormField v-slot="$field" name="category_ids" class="flex flex-col gap-1">
      <label for="import-categories" class="text-sm font-medium">Categories</label>
      <CategoryTreeMultiSelect input-id="import-categories" :model-value="$field.value || []" :options="categoryTree" :disabled="loading || optionsLoading" @update:model-value="updateCategories($event, $field, $form.primary_category_id?.value)" />
      <Message v-if="backendError('category_ids') || $field.invalid" severity="error" size="small" variant="simple">{{ backendError('category_ids') || $field.error?.message }}</Message>
    </FormField>
    <div class="flex flex-col gap-1">
      <label for="import-primary-category" class="text-sm font-medium">Primary category</label>
      <Select input-id="import-primary-category" aria-label="Primary category" name="primary_category_id" :options="selectedCategoryChoices($form.category_ids?.value)" option-label="label" option-value="value" :disabled="loading || optionsLoading || !$form.category_ids?.value?.length" placeholder="Select primary category" fluid />
      <Message v-if="backendError('primary_category_id') || $form.primary_category_id?.invalid" severity="error" size="small" variant="simple">{{ backendError('primary_category_id') || $form.primary_category_id?.error?.message }}</Message>
    </div>
    <div class="flex justify-end">
      <Button type="submit" label="Queue import" icon="pi pi-upload" :loading="loading" :disabled="loading || optionsLoading || !file || !$form.valid" />
    </div>
  </Form>
</template>
