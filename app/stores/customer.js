import { defineStore } from "pinia";
import { CUSTOMERS } from "~/constants/endpoints";

export const useCustomerStore = defineStore("customer", () => {
  const customers = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const filters = ref({
    search: "",
  });
  const sorting = ref({
    sort_by: null,
    sort_dir: null,
  });
  const loading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    if (filters.value.search) params.set("search", filters.value.search);

    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }

    return params.toString();
  }

  async function fetchCustomers() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${CUSTOMERS.LIST}?${query}`);
      customers.value = response.data;
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
    fetchCustomers();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchCustomers();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchCustomers();
  }

  function resetFilters() {
    filters.value = { search: "" };
    pagination.value.current_page = 1;
    fetchCustomers();
  }

  return {
    customers,
    pagination,
    filters,
    sorting,
    loading,
    fetchCustomers,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
