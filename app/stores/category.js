import { defineStore } from "pinia";
import { CATEGORIES } from "~/constants/endpoints";

export const useCategoryStore = defineStore("category", () => {
  const categories = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const filters = ref({
    search: "",
    is_active: null,
    is_parent: null,
  });
  const sorting = ref({
    sort_by: null,
    sort_dir: null,
  });
  const category = ref(null);
  const categoryLoading = ref(false);
  const loading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    if (filters.value.search) params.set("search", filters.value.search);
    if (filters.value.is_active !== null) params.set("is_active", filters.value.is_active);
    if (filters.value.is_parent !== null) params.set("is_parent", filters.value.is_parent);

    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }

    return params.toString();
  }

  async function fetchCategories() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${CATEGORIES.LIST}?${query}`);
      categories.value = response.data;
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
    fetchCategories();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchCategories();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchCategories();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      is_active: null,
      is_parent: null,
    };
    pagination.value.current_page = 1;
    fetchCategories();
  }

  async function fetchCategory(id) {
    categoryLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(CATEGORIES.SHOW(id));
      category.value = response.data;
    } finally {
      categoryLoading.value = false;
    }
  }

  async function createCategory(formData) {
    const api = useApiClient();
    return await api.postFormData(CATEGORIES.CREATE, formData);
  }

  async function updateCategory(id, formData) {
    const api = useApiClient();
    return await api.putFormData(CATEGORIES.UPDATE(id), formData);
  }

  return {
    categories,
    category,
    categoryLoading,
    pagination,
    filters,
    sorting,
    loading,
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
