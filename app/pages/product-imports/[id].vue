<script setup>
import { useProductImportStore } from "~/stores/productImport";
import { useProductImportProgress } from "~/composables/useProductImportProgress";
import ProductImportDetails from "~/components/product-imports/ProductImportDetails.vue";
const route = useRoute();
const { can } = usePermissions();
const allowed = computed(() => can("View_Product"));
const store = useProductImportStore();
const { record, error, loading, refresh } = useProductImportProgress(() => route.params.id, allowed);
const optionsError = shallowRef("");
async function loadOptions() {
  optionsError.value = "";
  try { await store.loadOptions(); }
  catch { optionsError.value = "Some configuration names could not be loaded. Their IDs are shown instead."; }
}
onMounted(() => { if (allowed.value) loadOptions(); });
</script>
<template>
  <div class="text-slate-900">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div><NuxtLink to="/product-imports" class="text-sm text-blue-600"><i class="pi pi-arrow-left mr-1" />Product Imports</NuxtLink><h1 class="text-2xl font-bold text-slate-900 mt-2">Import details</h1></div>
      <Button v-if="allowed" label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="refresh" />
    </div>
    <Message v-if="!allowed" severity="warn" :closable="false">You do not have permission to view product imports.</Message>
    <template v-else>
      <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>
      <Message v-if="optionsError" severity="warn" :closable="false" class="mb-4">{{ optionsError }} <Button label="Retry" text @click="loadOptions" /></Message>
      <div v-if="loading && !record" class="py-8" role="status"><ProgressSpinner /><p>Loading import...</p></div>
      <ProductImportDetails v-if="record" :record="record" :options="store.options" />
    </template>
  </div>
</template>
