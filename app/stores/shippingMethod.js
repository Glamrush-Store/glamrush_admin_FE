import { defineStore } from "pinia";
import { SHIPPING_METHODS } from "~/constants/endpoints";

export const useShippingMethodStore = defineStore("shippingMethod", () => {
  const methods = ref([]);
  const method = ref(null);
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const filters = ref({ name: "", code: "", is_active: null });
  const sorting = ref({ sort_by: null, sort_dir: null });
  const loading = ref(false);
  const methodLoading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);
    if (filters.value.name) params.set("name", filters.value.name);
    if (filters.value.code) params.set("code", filters.value.code);
    if (filters.value.is_active !== null) params.set("is_active", filters.value.is_active);
    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }
    return params.toString();
  }

  async function fetchMethods() {
    loading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(`${SHIPPING_METHODS.LIST}?${buildQueryString()}`);
      methods.value = response.data;
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

  async function fetchMethod(id) {
    methodLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(SHIPPING_METHODS.SHOW(id));
      method.value = response.data;
    } finally {
      methodLoading.value = false;
    }
  }

  async function createMethod(data) {
    const api = useApiClient();
    return await api.post(SHIPPING_METHODS.CREATE, data);
  }

  async function updateMethod(id, data) {
    const api = useApiClient();
    return await api.put(SHIPPING_METHODS.UPDATE(id), data);
  }

  async function deleteMethod(id) {
    const api = useApiClient();
    await api.del(SHIPPING_METHODS.DELETE(id));
    methods.value = methods.value.filter((m) => m.id !== id);
    pagination.value.total = Math.max(0, pagination.value.total - 1);
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchMethods();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchMethods();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchMethods();
  }

  function resetFilters() {
    filters.value = { name: "", code: "", is_active: null };
    pagination.value.current_page = 1;
    fetchMethods();
  }

  return {
    methods, method, pagination, filters, sorting, loading, methodLoading,
    fetchMethods, fetchMethod, createMethod, updateMethod, deleteMethod,
    setFilter, setPage, setSorting, resetFilters,
  };
});
