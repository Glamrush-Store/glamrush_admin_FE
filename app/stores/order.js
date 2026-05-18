import { defineStore } from "pinia";
import { ORDERS } from "~/constants/endpoints";

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

const defaultFilters = {
  order_number: "",
  email: "",
  status: null,
  date_from: null,
  date_to: null,
};

export const useOrderStore = defineStore("order", () => {
  const orders = ref([]);
  const pagination = ref({ ...defaultPagination });
  const filters = ref({ ...defaultFilters });
  const sorting = ref({
    sort_by: "created_at",
    sort_dir: "desc",
  });
  const order = ref(null);
  const orderLoading = ref(false);
  const statusUpdating = ref(false);
  const loading = ref(false);
  const error = ref(null);
  const orderError = ref(null);
  const statusError = ref(null);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    if (filters.value.order_number) params.set("order_number", filters.value.order_number);
    if (filters.value.email) params.set("email", filters.value.email);
    if (filters.value.status) params.set("status", filters.value.status);
    if (filters.value.date_from) params.set("date_from", filters.value.date_from);
    if (filters.value.date_to) params.set("date_to", filters.value.date_to);

    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "desc");
    }

    return params.toString();
  }

  function applyListResponse(response) {
    const payload = response.data;
    const meta = response.meta || payload?.meta;

    orders.value = Array.isArray(payload) ? payload : payload?.data || [];
    pagination.value = {
      current_page: meta?.current_page || payload?.current_page || 1,
      last_page: meta?.last_page || payload?.last_page || 1,
      per_page: meta?.per_page || payload?.per_page || defaultPagination.per_page,
      total: meta?.total || payload?.total || 0,
    };
  }

  async function fetchOrders() {
    loading.value = true;
    error.value = null;
    try {
      const api = useApiClient();
      const response = await api.get(`${ORDERS.LIST}?${buildQueryString()}`);
      applyListResponse(response);
    } catch (err) {
      error.value = err.message || "Unable to load orders";
      orders.value = [];
      pagination.value = { ...defaultPagination };
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrder(id) {
    orderLoading.value = true;
    orderError.value = null;
    order.value = null;
    try {
      const api = useApiClient();
      const response = await api.get(ORDERS.SHOW(id));
      order.value = response.data;
    } catch (err) {
      orderError.value = err.message || "Unable to load order";
    } finally {
      orderLoading.value = false;
    }
  }

  async function updateOrderStatus(id, status) {
    statusUpdating.value = true;
    statusError.value = null;
    try {
      const api = useApiClient();
      const response = await api.patch(ORDERS.UPDATE_STATUS(id), { status });
      order.value = { ...order.value, ...(response.data || {}), status: response.data?.status || status };
      return response;
    } catch (err) {
      statusError.value = err.message || "Unable to update order status";
      throw err;
    } finally {
      statusUpdating.value = false;
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchOrders();
  }

  function setFilters(values) {
    filters.value = { ...filters.value, ...values };
    pagination.value.current_page = 1;
    fetchOrders();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchOrders();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field || "created_at";
    sorting.value.sort_dir = order || "desc";
    pagination.value.current_page = 1;
    fetchOrders();
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
    pagination.value.current_page = 1;
    fetchOrders();
  }

  return {
    orders,
    order,
    pagination,
    filters,
    sorting,
    loading,
    orderLoading,
    statusUpdating,
    error,
    orderError,
    statusError,
    fetchOrders,
    fetchOrder,
    updateOrderStatus,
    setFilter,
    setFilters,
    setPage,
    setSorting,
    resetFilters,
  };
});
