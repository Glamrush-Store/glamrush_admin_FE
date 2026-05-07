import { defineStore } from "pinia";
import { SHIPPING_RATES } from "~/constants/endpoints";

export const useShippingRateStore = defineStore("shippingRate", () => {
  const rates = ref([]);
  const rate = ref(null);
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const filters = ref({ shipping_zone_id: null, shipping_method_id: null, rate_type: null, is_active: null });
  const sorting = ref({ sort_by: null, sort_dir: null });
  const loading = ref(false);
  const rateLoading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);
    if (filters.value.shipping_zone_id) params.set("shipping_zone_id", filters.value.shipping_zone_id);
    if (filters.value.shipping_method_id) params.set("shipping_method_id", filters.value.shipping_method_id);
    if (filters.value.rate_type) params.set("rate_type", filters.value.rate_type);
    if (filters.value.is_active !== null) params.set("is_active", filters.value.is_active);
    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }
    return params.toString();
  }

  async function fetchRates() {
    loading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(`${SHIPPING_RATES.LIST}?${buildQueryString()}`);
      rates.value = response.data;
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

  async function fetchRate(id) {
    rateLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(SHIPPING_RATES.SHOW(id));
      rate.value = response.data;
    } finally {
      rateLoading.value = false;
    }
  }

  async function createRate(data) {
    const api = useApiClient();
    return await api.post(SHIPPING_RATES.CREATE, data);
  }

  async function updateRate(id, data) {
    const api = useApiClient();
    return await api.put(SHIPPING_RATES.UPDATE(id), data);
  }

  async function deleteRate(id) {
    const api = useApiClient();
    await api.del(SHIPPING_RATES.DELETE(id));
    rates.value = rates.value.filter((r) => r.id !== id);
    pagination.value.total = Math.max(0, pagination.value.total - 1);
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchRates();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchRates();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchRates();
  }

  function resetFilters() {
    filters.value = { shipping_zone_id: null, shipping_method_id: null, rate_type: null, is_active: null };
    pagination.value.current_page = 1;
    fetchRates();
  }

  return {
    rates, rate, pagination, filters, sorting, loading, rateLoading,
    fetchRates, fetchRate, createRate, updateRate, deleteRate,
    setFilter, setPage, setSorting, resetFilters,
  };
});
