import { defineStore } from "pinia";
import { BRANDS } from "~/constants/endpoints";

export const useBrandStore = defineStore("brand", () => {
  const brands = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const filters = ref({
    search: "",
    is_active: null,
  });
  const sorting = ref({
    sort_by: null,
    sort_dir: null,
  });
  const brand = ref(null);
  const brandLoading = ref(false);
  const loading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    if (filters.value.search) params.set("search", filters.value.search);
    if (filters.value.is_active !== null) params.set("is_active", filters.value.is_active);

    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }

    return params.toString();
  }

  async function fetchBrands() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${BRANDS.LIST}?${query}`);
      brands.value = response.data;
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

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchBrands();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchBrands();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchBrands();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      is_active: null,
    };
    pagination.value.current_page = 1;
    fetchBrands();
  }

  async function fetchBrand(id) {
    brandLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(BRANDS.SHOW(id));
      brand.value = response.data;
    } finally {
      brandLoading.value = false;
    }
  }

  async function createBrand(formData) {
    const api = useApiClient();
    return await api.postFormData(BRANDS.CREATE, formData);
  }

  async function updateBrand(id, formData) {
    const api = useApiClient();
    return await api.putFormData(BRANDS.UPDATE(id), formData);
  }

  return {
    brands,
    brand,
    brandLoading,
    pagination,
    filters,
    sorting,
    loading,
    fetchBrands,
    fetchBrand,
    createBrand,
    updateBrand,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
