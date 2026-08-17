import { defineStore } from "pinia";
import { CACHE_METRICS } from "~/constants/endpoints";
import { getDefaultCacheMetricRange } from "~/constants/cacheMetrics";

const defaultRange = getDefaultCacheMetricRange();

const defaultFilters = {
  service: null,
  area: null,
  from: defaultRange.from,
  to: defaultRange.to,
  page: 1,
  per_page: 250,
  sort_dir: "asc",
};

function buildQuery(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, value);
    }
  });

  return params.toString();
}

function unwrapResponse(response) {
  return response?.data || null;
}

export const useCacheMetricsStore = defineStore("cacheMetrics", () => {
  const metrics = ref(null);
  const status = ref(null);
  const filters = ref({ ...defaultFilters });
  const loading = ref(false);
  const statusLoading = ref(false);
  const refreshing = ref(false);
  const flushing = ref(false);
  const error = ref(null);
  const statusError = ref(null);

  async function fetchMetrics(overrides = {}) {
    filters.value = {
      ...filters.value,
      ...overrides,
    };

    loading.value = true;
    error.value = null;

    try {
      const api = useApiClient();
      const response = await api.get(`${CACHE_METRICS.LIST}?${buildQuery(filters.value)}`);
      metrics.value = unwrapResponse(response);
      return response;
    } catch (err) {
      error.value = err.message || "Unable to load cache metrics";
      metrics.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatus() {
    statusLoading.value = true;
    statusError.value = null;

    try {
      const api = useApiClient();
      const response = await api.get(CACHE_METRICS.STATUS);
      status.value = unwrapResponse(response);
      return response;
    } catch (err) {
      statusError.value = err.message || "Unable to load cache status";
      status.value = null;
      throw err;
    } finally {
      statusLoading.value = false;
    }
  }

  function refresh() {
    return Promise.all([fetchStatus(), fetchMetrics()]);
  }

  async function refreshMetrics() {
    refreshing.value = true;

    try {
      const api = useApiClient();
      return await api.post(CACHE_METRICS.REFRESH);
    } finally {
      refreshing.value = false;
    }
  }

  async function flushCache(payload) {
    flushing.value = true;

    try {
      const api = useApiClient();
      return await api.post(CACHE_METRICS.FLUSH, payload);
    } finally {
      flushing.value = false;
    }
  }

  function resetFilters() {
    const range = getDefaultCacheMetricRange();
    filters.value = {
      ...defaultFilters,
      from: range.from,
      to: range.to,
    };
    return fetchMetrics();
  }

  return {
    metrics,
    status,
    filters,
    loading,
    statusLoading,
    refreshing,
    flushing,
    error,
    statusError,
    fetchMetrics,
    fetchStatus,
    refresh,
    refreshMetrics,
    flushCache,
    resetFilters,
  };
});
