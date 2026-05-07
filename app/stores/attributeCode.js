import { defineStore } from "pinia";
import { SKU_ATTRIBUTE_CODES } from "~/constants/endpoints";

export const useAttributeCodeStore = defineStore("attributeCode", () => {
  const attributeCodes = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const filters = ref({
    search: "",
    type: null,
  });
  const sorting = ref({
    sort_by: null,
    sort_dir: null,
  });
  const types = ref([]);
  const activeValuesByType = ref({});
  const loading = ref(false);

  async function fetchTypes() {
    const api = useApiClient();
    const response = await api.get(SKU_ATTRIBUTE_CODES.TYPES);
    types.value = response.data;
  }

  async function fetchActiveByType(type) {
    if (activeValuesByType.value[type]) return;
    const api = useApiClient();
    const response = await api.get(
      `${SKU_ATTRIBUTE_CODES.LIST}?type=${type}`,
    );
    activeValuesByType.value[type] = response.data;
  }

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    if (filters.value.search) params.set("search", filters.value.search);
    if (filters.value.type) params.set("type", filters.value.type);

    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }

    return params.toString();
  }

  async function fetchAttributeCodes() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${SKU_ATTRIBUTE_CODES.LIST}?${query}`);
      attributeCodes.value = response.data;
      pagination.value = {
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
      };
    } finally {
      loading.value = false;
    }
  }

  async function createAttributeCode(data) {
    const api = useApiClient();
    return await api.post(SKU_ATTRIBUTE_CODES.CREATE, data);
  }

  async function deleteAttributeCode(id) {
    const api = useApiClient();
    await api.del(SKU_ATTRIBUTE_CODES.DELETE(id));
    await fetchAttributeCodes();
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchAttributeCodes();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchAttributeCodes();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchAttributeCodes();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      type: null,
    };
    pagination.value.current_page = 1;
    fetchAttributeCodes();
  }

  return {
    attributeCodes,
    types,
    activeValuesByType,
    pagination,
    filters,
    sorting,
    loading,
    fetchTypes,
    fetchActiveByType,
    fetchAttributeCodes,
    createAttributeCode,
    deleteAttributeCode,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
