import { defineStore } from "pinia";
import { VENDORS } from "~/constants/endpoints";

export const useVendorStore = defineStore("vendor", () => {
  const vendors = ref([]);
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
  const vendor = ref(null);
  const vendorLoading = ref(false);
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

  async function fetchVendors() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${VENDORS.LIST}?${query}`);
      vendors.value = response.data;
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
    fetchVendors();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchVendors();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchVendors();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      is_active: null,
    };
    pagination.value.current_page = 1;
    fetchVendors();
  }

  async function fetchVendor(id) {
    vendorLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(VENDORS.SHOW(id));
      vendor.value = response.data;
    } finally {
      vendorLoading.value = false;
    }
  }

  async function createVendor(data) {
    const api = useApiClient();
    return await api.post(VENDORS.CREATE, data);
  }

  async function updateVendor(id, data) {
    const api = useApiClient();
    return await api.put(VENDORS.UPDATE(id), data);
  }

  return {
    vendors,
    vendor,
    vendorLoading,
    pagination,
    filters,
    sorting,
    loading,
    fetchVendors,
    fetchVendor,
    createVendor,
    updateVendor,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
