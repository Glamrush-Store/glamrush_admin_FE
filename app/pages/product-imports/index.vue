<script setup>
import { useToast } from "primevue/usetoast";
import { useProductImportStore } from "~/stores/productImport";
import ProductImportForm from "~/components/product-imports/ProductImportForm.vue";
import ProductImportHistory from "~/components/product-imports/ProductImportHistory.vue";
const store = useProductImportStore();
const { can } = usePermissions();
const route = useRoute();
const toast = useToast();
const canView = computed(() => can("View_Product"));
const canCreate = computed(() => can("Create_Product"));
const visible = shallowRef(false);
const error = shallowRef("");
const formError = shallowRef("");
const fieldErrors = ref({});
const optionsError = shallowRef("");
const downloading = shallowRef(false);
function notify(exception, summary) {
  toast.add({ severity: "error", summary, detail: exception.status === 403 ? "You do not have permission to perform this action." : exception.message || "Request failed.", life: 6000 });
}
async function loadHistory(page, rows) {
  if (!canView.value) return;
  error.value = "";
  try { await store.fetchImports(page, rows); }
  catch (exception) { error.value = exception.status === 403 ? "You do not have permission to view product imports." : exception.message; notify(exception, "Unable to load imports"); }
}
async function loadOptions() {
  optionsError.value = "";
  try { await store.loadOptions(); }
  catch (exception) { optionsError.value = exception.message || "Unable to load import options."; }
}
async function openForm() {
  if (!canCreate.value) return;
  visible.value = true;
  formError.value = "";
  fieldErrors.value = {};
  await loadOptions();
}
async function submit(values) {
  if (!canCreate.value || store.creating) return;
  fieldErrors.value = {};
  formError.value = "";
  try {
    const response = await store.createImport(values);
    toast.add({ severity: "success", summary: "Import queued", detail: response.message, life: 5000 });
    visible.value = false;
    if (canView.value && response.data?.id) await navigateTo(`/product-imports/${response.data.id}`);
  } catch (exception) {
    fieldErrors.value = exception.errors || {};
    formError.value = exception.status === 403 ? "You do not have permission to import products." : exception.message;
    notify(exception, "Import could not be queued");
  }
}
async function download() {
  if (!canView.value || downloading.value) return;
  downloading.value = true;
  try { await store.downloadTemplate(); }
  catch (exception) { notify(exception, "Template download failed"); }
  finally { downloading.value = false; }
}
onMounted(() => {
  loadHistory();
  if (route.query.create === "1") openForm();
});
</script>
<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-3 mb-5">
      <h1 class="text-2xl font-bold text-slate-900">Product Imports</h1>
      <div class="flex flex-wrap gap-2">
        <Button v-if="canView" label="Download CSV template" icon="pi pi-download" severity="secondary" outlined :loading="downloading" @click="download" />
        <Button v-if="canView" icon="pi pi-refresh" aria-label="Refresh import history" v-tooltip.top="'Refresh history'" severity="secondary" outlined :loading="store.loading" @click="loadHistory()" />
        <Button v-if="canCreate" label="Import Products" icon="pi pi-upload" @click="openForm" />
      </div>
    </div>
    <Message v-if="!canView" severity="warn" :closable="false">You do not have permission to view product import history.</Message>
    <template v-else>
      <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }} <Button label="Retry" text @click="loadHistory()" /></Message>
      <ProductImportHistory :records="store.imports" :loading="store.loading" :pagination="store.pagination" @page="loadHistory($event.page + 1, $event.rows)" />
    </template>
    <Dialog v-if="canCreate" v-model:visible="visible" header="Import products from CSV" modal :closable="!store.creating" :close-on-escape="!store.creating" :style="{ width: '42rem', maxWidth: 'calc(100vw - 2rem)' }">
      <Message v-if="formError" severity="error" :closable="false" class="mb-4">{{ formError }}</Message>
      <Message v-if="optionsError" severity="error" :closable="false" class="mb-4">{{ optionsError }} <Button label="Retry options" text @click="loadOptions" /></Message>
      <ProductImportForm v-if="visible" :options="store.options" :options-loading="store.optionsLoading" :loading="store.creating" :errors="fieldErrors" @submit="submit" />
    </Dialog>
  </div>
</template>
