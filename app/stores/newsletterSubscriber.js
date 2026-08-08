import { defineStore } from "pinia";
import { NEWSLETTER_SUBSCRIBERS } from "~/constants/endpoints";

const emptyFilters = () => ({
  search: "",
  status: null,
  source: "",
  confirmed_from: null,
  confirmed_to: null,
});

export const useNewsletterSubscriberStore = defineStore("newsletterSubscriber", () => {
  const subscribers = ref([]);
  const selectedSubscriber = ref(null);
  const pagination = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const filters = ref(emptyFilters());
  const sorting = ref({ sort_by: "created_at", sort_dir: "desc" });
  const loading = ref(false);
  const detailsLoading = ref(false);
  const exporting = ref(false);
  const error = ref("");
  const detailsError = ref("");
  const permissionDenied = ref(false);

  function dateValue(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function buildQueryString(exportOnly = false) {
    const params = new URLSearchParams();
    if (!exportOnly) {
      params.set("page", pagination.value.current_page);
      params.set("per_page", pagination.value.per_page);
      if (filters.value.search) params.set("search", filters.value.search);
      if (filters.value.status) params.set("status", filters.value.status);
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir);
    }
    if (filters.value.source) params.set("source", filters.value.source);
    if (filters.value.confirmed_from) params.set("confirmed_from", dateValue(filters.value.confirmed_from));
    if (filters.value.confirmed_to) params.set("confirmed_to", dateValue(filters.value.confirmed_to));
    return params.toString();
  }

  async function fetchSubscribers() {
    loading.value = true;
    error.value = "";
    permissionDenied.value = false;
    try {
      const response = await useApiClient().get(`${NEWSLETTER_SUBSCRIBERS.LIST}?${buildQueryString()}`);
      subscribers.value = response.data;
      pagination.value = {
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
      };
    } catch (exception) {
      permissionDenied.value = exception.status === 403;
      error.value = exception.message || "Subscribers could not be loaded.";
      subscribers.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubscriber(id) {
    detailsLoading.value = true;
    detailsError.value = "";
    selectedSubscriber.value = null;
    try {
      const response = await useApiClient().get(NEWSLETTER_SUBSCRIBERS.SHOW(id));
      selectedSubscriber.value = response.data;
    } catch (exception) {
      detailsError.value = exception.message || "Subscriber details could not be loaded.";
    } finally {
      detailsLoading.value = false;
    }
  }

  async function exportSubscribers() {
    exporting.value = true;
    try {
      const query = buildQueryString(true);
      return await useApiClient().download(`${NEWSLETTER_SUBSCRIBERS.EXPORT}${query ? `?${query}` : ""}`);
    } finally {
      exporting.value = false;
    }
  }

  function applyFilters(nextFilters) {
    filters.value = { ...emptyFilters(), ...nextFilters };
    pagination.value.current_page = 1;
    return fetchSubscribers();
  }

  function resetFilters() {
    return applyFilters(emptyFilters());
  }

  function setPage(page, perPage = pagination.value.per_page) {
    pagination.value.current_page = page;
    pagination.value.per_page = perPage;
    return fetchSubscribers();
  }

  function setSorting(field, direction) {
    sorting.value = { sort_by: field || "created_at", sort_dir: direction || "desc" };
    pagination.value.current_page = 1;
    return fetchSubscribers();
  }

  return {
    subscribers,
    selectedSubscriber,
    pagination,
    filters,
    sorting,
    loading,
    detailsLoading,
    exporting,
    error,
    detailsError,
    permissionDenied,
    fetchSubscribers,
    fetchSubscriber,
    exportSubscribers,
    applyFilters,
    resetFilters,
    setPage,
    setSorting,
  };
});
