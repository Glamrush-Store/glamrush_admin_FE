import { defineStore } from "pinia";
import { PAYMENT_TRANSACTIONS } from "~/constants/endpoints";

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

const defaultFilters = {
  search: "",
  status: null,
  type: null,
  provider: null,
  date_from: null,
  date_to: null,
};

export const usePaymentTransactionStore = defineStore("paymentTransaction", () => {
  const transactions = ref([]);
  const pagination = ref({ ...defaultPagination });
  const filters = ref({ ...defaultFilters });
  const sorting = ref({
    sort_by: "created_at",
    sort_dir: "desc",
  });
  const loading = ref(false);
  const error = ref("");

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    Object.entries(filters.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, value);
      }
    });

    params.set("sort_by", sorting.value.sort_by || "created_at");
    params.set("sort_dir", sorting.value.sort_dir || "desc");

    return params.toString();
  }

  function applyListResponse(response) {
    const payload = response.data;
    const meta = response.meta || payload?.meta;

    transactions.value = Array.isArray(payload) ? payload : payload?.data || [];
    pagination.value = {
      current_page: meta?.current_page || payload?.current_page || 1,
      last_page: meta?.last_page || payload?.last_page || 1,
      per_page: meta?.per_page || payload?.per_page || defaultPagination.per_page,
      total: meta?.total || payload?.total || 0,
    };
  }

  async function fetchTransactions() {
    loading.value = true;
    error.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(`${PAYMENT_TRANSACTIONS.LIST}?${buildQueryString()}`);
      applyListResponse(response);
    } catch (err) {
      error.value = err.message || "Unable to load payment transactions";
      transactions.value = [];
      pagination.value = { ...defaultPagination };
    } finally {
      loading.value = false;
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchTransactions();
  }

  function setFilters(values) {
    filters.value = { ...filters.value, ...values };
    pagination.value.current_page = 1;
    fetchTransactions();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchTransactions();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field || "created_at";
    sorting.value.sort_dir = order || "desc";
    pagination.value.current_page = 1;
    fetchTransactions();
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
    pagination.value.current_page = 1;
    fetchTransactions();
  }

  return {
    transactions,
    pagination,
    filters,
    sorting,
    loading,
    error,
    fetchTransactions,
    setFilter,
    setFilters,
    setPage,
    setSorting,
    resetFilters,
  };
});
