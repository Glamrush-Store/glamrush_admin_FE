import { defineStore } from "pinia";
import { PRODUCT_IMPORTS, VENDORS, BRANDS, CATEGORIES } from "~/constants/endpoints";
import { buildProductImportFormData, IMPORT_TEMPLATE_FILENAME } from "~/utils/productImports";

export const useProductImportStore = defineStore("productImport", () => {
  const imports = ref([]);
  const pagination = ref({ current_page: 1, per_page: 15, total: 0 });
  const loading = ref(false);
  const creating = ref(false);
  const optionsLoading = ref(false);
  const options = ref({ vendors: [], brands: [], categories: [] });
  const historyStale = ref(true);

  async function fetchImports(page = pagination.value.current_page, perPage = pagination.value.per_page) {
    loading.value = true;
    try {
      const response = await useApiClient().get(`${PRODUCT_IMPORTS.LIST}?page=${page}&per_page=${perPage}`);
      imports.value = response.data || [];
      pagination.value = { ...pagination.value, ...response.meta };
      historyStale.value = false;
    } finally { loading.value = false; }
  }
  async function createImport(values) {
    if (creating.value) return;
    creating.value = true;
    try {
      const response = await useApiClient().postFormData(PRODUCT_IMPORTS.CREATE, buildProductImportFormData(values));
      historyStale.value = true;
      return response;
    } finally { creating.value = false; }
  }
  async function fetchImport(id) {
    const response = await useApiClient().get(PRODUCT_IMPORTS.SHOW(id));
    return response.data;
  }
  function downloadTemplate() {
    return useApiClient().download(PRODUCT_IMPORTS.TEMPLATE, IMPORT_TEMPLATE_FILENAME);
  }
  async function loadOptions() {
    optionsLoading.value = true;
    const api = useApiClient();
    async function allPages(endpoint) {
      const records = [];
      let page = 1;
      let lastPage = 1;
      do {
        const response = await api.get(`${endpoint}?page=${page}&per_page=100`);
        records.push(...(response.data || []));
        lastPage = Number(response.meta?.last_page || 1);
        page++;
      } while (page <= lastPage);
      return records;
    }
    try {
      const results = await Promise.allSettled([allPages(VENDORS.LIST), allPages(BRANDS.LIST), allPages(CATEGORIES.LIST)]);
      const keys = ["vendors", "brands", "categories"];
      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const key = keys[index];
        options.value[key] = result.value.map((item) => ({
          ...item,
          label: key === "vendors" ? item.business_name || item.name : item.name,
          value: String(item.id),
        }));
      });
      const failure = results.find((result) => result.status === "rejected");
      if (failure) throw failure.reason;
    } finally { optionsLoading.value = false; }
  }
  return { imports, pagination, loading, creating, optionsLoading, options, historyStale, fetchImports, createImport, fetchImport, downloadTemplate, loadOptions };
});
