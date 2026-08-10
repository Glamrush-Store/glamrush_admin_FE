import { defineStore } from "pinia";
import { DASHBOARD } from "~/constants/endpoints";

const defaultFilters = {
  period: "week",
  from: null,
  to: null,
};

function unwrapAnalytics(response) {
  return response?.data || null;
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  params.set("period", filters.period || "week");
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params.toString();
}

export const useDashboardAnalyticsStore = defineStore("dashboardAnalytics", () => {
  const analytics = ref(null);
  const filters = ref({ ...defaultFilters });
  const loading = ref(false);
  const error = ref(null);

  async function fetchAnalytics(overrides = {}) {
    filters.value = { ...filters.value, ...overrides };
    loading.value = true;
    error.value = null;

    try {
      const api = useApiClient();
      const response = await api.get(`${DASHBOARD.ANALYTICS}?${buildQuery(filters.value)}`);
      analytics.value = unwrapAnalytics(response);
      return response;
    } catch (err) {
      error.value = err.message || "Unable to load dashboard analytics";
      analytics.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setPeriod(period) {
    filters.value = {
      ...filters.value,
      period,
      from: null,
      to: null,
    };
    return fetchAnalytics();
  }

  function setDateRange(from, to) {
    filters.value = {
      ...filters.value,
      from,
      to,
    };
    return fetchAnalytics();
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
    return fetchAnalytics();
  }

  return {
    analytics,
    filters,
    loading,
    error,
    fetchAnalytics,
    setPeriod,
    setDateRange,
    resetFilters,
  };
});
