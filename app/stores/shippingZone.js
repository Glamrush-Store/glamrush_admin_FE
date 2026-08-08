import { defineStore } from "pinia";
import { SHIPPING_ZONES } from "~/constants/endpoints";

export const useShippingZoneStore = defineStore("shippingZone", () => {
  const zones = ref([]);
  const zone = ref(null);
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const filters = ref({ name: "", country: "", is_active: null });
  const sorting = ref({ sort_by: null, sort_dir: null });
  const loading = ref(false);
  const zoneLoading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);
    if (filters.value.name) params.set("name", filters.value.name);
    if (filters.value.country) params.set("country", filters.value.country);
    if (filters.value.is_active !== null) params.set("is_active", filters.value.is_active);
    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }
    return params.toString();
  }

  async function fetchZones() {
    loading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(`${SHIPPING_ZONES.LIST}?${buildQueryString()}`);
      zones.value = response.data;
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

  async function fetchZone(id) {
    zoneLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(SHIPPING_ZONES.SHOW(id));
      zone.value = response.data;
    } finally {
      zoneLoading.value = false;
    }
  }

  async function createZone(data) {
    const api = useApiClient();
    return await api.post(SHIPPING_ZONES.CREATE, data);
  }

  async function updateZone(id, data) {
    const api = useApiClient();
    return await api.put(SHIPPING_ZONES.UPDATE(id), data);
  }

  async function deleteZone(id) {
    const api = useApiClient();
    await api.del(SHIPPING_ZONES.DELETE(id));
    zones.value = zones.value.filter((z) => z.id !== id);
    pagination.value.total = Math.max(0, pagination.value.total - 1);
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchZones();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchZones();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchZones();
  }

  function resetFilters() {
    filters.value = { name: "", country: "", is_active: null };
    pagination.value.current_page = 1;
    fetchZones();
  }

  return {
    zones, zone, pagination, filters, sorting, loading, zoneLoading,
    fetchZones, fetchZone, createZone, updateZone, deleteZone,
    setFilter, setPage, setSorting, resetFilters,
  };
});
