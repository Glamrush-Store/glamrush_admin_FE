import { defineStore } from "pinia";
import { SHIPMENTS } from "~/constants/endpoints";

export const useShipmentStore = defineStore("shipment", () => {
  const shipments = ref([]);
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const filters = ref({ order_id: "", status: null, shipping_method_id: null });
  const sorting = ref({ sort_by: null, sort_dir: null });
  const loading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);
    if (filters.value.order_id) params.set("order_id", filters.value.order_id);
    if (filters.value.status) params.set("status", filters.value.status);
    if (filters.value.shipping_method_id) params.set("shipping_method_id", filters.value.shipping_method_id);
    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }
    return params.toString();
  }

  async function fetchShipments() {
    loading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(`${SHIPMENTS.LIST}?${buildQueryString()}`);
      shipments.value = response.data;
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
    fetchShipments();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchShipments();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchShipments();
  }

  function resetFilters() {
    filters.value = { order_id: "", status: null, shipping_method_id: null };
    pagination.value.current_page = 1;
    fetchShipments();
  }

  return { shipments, pagination, filters, sorting, loading, fetchShipments, setFilter, setPage, setSorting, resetFilters };
});
