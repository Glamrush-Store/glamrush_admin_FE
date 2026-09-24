import { defineStore } from "pinia";
import { CONTACT_SUBMISSION_SORT_FIELDS } from "~/constants/contactSubmissions";
import { CONTACT_SUBMISSIONS } from "~/constants/endpoints";

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

const emptyFilters = () => ({
  search: "",
  status: null,
  source: "",
  date_from: null,
  date_to: null,
});

function formatDateParam(value) {
  if (!value) return "";
  if (typeof value === "string") return value;

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizedListResponse(response) {
  const payload = response.data;
  const meta = response.meta || payload?.meta;

  return {
    data: Array.isArray(payload) ? payload : payload?.data || [],
    pagination: {
      current_page: meta?.current_page || payload?.current_page || defaultPagination.current_page,
      last_page: meta?.last_page || payload?.last_page || defaultPagination.last_page,
      per_page: meta?.per_page || payload?.per_page || defaultPagination.per_page,
      total: meta?.total || payload?.total || 0,
    },
  };
}

export const useContactSubmissionStore = defineStore("contactSubmission", () => {
  const submissions = ref([]);
  const selectedSubmission = ref(null);
  const pagination = ref({ ...defaultPagination });
  const filters = ref(emptyFilters());
  const sorting = ref({ sort_by: "created_at", sort_dir: "desc" });
  const loading = ref(false);
  const detailsLoading = ref(false);
  const statusLoading = ref(false);
  const error = ref("");
  const detailsError = ref("");
  const permissionDenied = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    Object.entries(filters.value).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      params.set(key, key.startsWith("date_") ? formatDateParam(value) : value);
    });

    const sortBy = CONTACT_SUBMISSION_SORT_FIELDS.includes(sorting.value.sort_by)
      ? sorting.value.sort_by
      : "created_at";
    const sortDir = sorting.value.sort_dir === "asc" ? "asc" : "desc";
    params.set("sort_by", sortBy);
    params.set("sort_dir", sortDir);

    return params.toString();
  }

  async function fetchSubmissions() {
    loading.value = true;
    error.value = "";
    permissionDenied.value = false;

    try {
      const response = await useApiClient().get(`${CONTACT_SUBMISSIONS.LIST}?${buildQueryString()}`);
      const normalized = normalizedListResponse(response);
      submissions.value = normalized.data;
      pagination.value = normalized.pagination;
    } catch (exception) {
      permissionDenied.value = exception.status === 403;
      error.value = exception.message || "Contact submissions could not be loaded.";
      submissions.value = [];
      pagination.value = { ...defaultPagination };
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubmission(id) {
    detailsLoading.value = true;
    detailsError.value = "";
    selectedSubmission.value = null;

    try {
      const response = await useApiClient().get(CONTACT_SUBMISSIONS.SHOW(id));
      selectedSubmission.value = response.data;
    } catch (exception) {
      detailsError.value = exception.message || "Contact submission details could not be loaded.";
    } finally {
      detailsLoading.value = false;
    }
  }

  async function updateSubmissionStatus(id, status) {
    statusLoading.value = true;

    try {
      const response = await useApiClient().patch(CONTACT_SUBMISSIONS.UPDATE_STATUS(id), { status });
      selectedSubmission.value = response.data || selectedSubmission.value;
      return response;
    } finally {
      statusLoading.value = false;
    }
  }

  function applyFilters(nextFilters) {
    filters.value = { ...emptyFilters(), ...nextFilters };
    pagination.value.current_page = 1;
    return fetchSubmissions();
  }

  function resetFilters() {
    return applyFilters(emptyFilters());
  }

  function setPage(page, perPage = pagination.value.per_page) {
    pagination.value.current_page = page;
    pagination.value.per_page = perPage;
    return fetchSubmissions();
  }

  function setSorting(field, direction) {
    sorting.value = {
      sort_by: CONTACT_SUBMISSION_SORT_FIELDS.includes(field) ? field : "created_at",
      sort_dir: direction === "asc" ? "asc" : "desc",
    };
    pagination.value.current_page = 1;
    return fetchSubmissions();
  }

  return {
    submissions,
    selectedSubmission,
    pagination,
    filters,
    sorting,
    loading,
    detailsLoading,
    statusLoading,
    error,
    detailsError,
    permissionDenied,
    fetchSubmissions,
    fetchSubmission,
    updateSubmissionStatus,
    applyFilters,
    resetFilters,
    setPage,
    setSorting,
  };
});

