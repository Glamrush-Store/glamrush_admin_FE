import { defineStore } from "pinia";
import { CATEGORIES, DISCOUNT_CODES } from "~/constants/endpoints";

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

const defaultFilters = {
  search: "",
  type: null,
  state: null,
  is_active: null,
  starts_at_from: null,
  starts_at_to: null,
  ends_at_from: null,
  ends_at_to: null,
};

export const useDiscountCodeStore = defineStore("discountCode", () => {
  const discountCodes = ref([]);
  const discountCode = ref(null);
  const storefronts = ref([]);
  const pagination = ref({ ...defaultPagination });
  const filters = ref({ ...defaultFilters });
  const sorting = ref({
    sort: "created_at",
    direction: "desc",
  });
  const loading = ref(false);
  const detailLoading = ref(false);
  const storefrontLoading = ref(false);
  const saving = ref(false);
  const actionLoading = ref(false);
  const error = ref("");
  const detailError = ref("");

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    Object.entries(filters.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, value);
      }
    });

    if (sorting.value.sort) {
      params.set("sort", sorting.value.sort);
      params.set("direction", sorting.value.direction || "desc");
    }

    return params.toString();
  }

  function applyListResponse(response) {
    const payload = response.data;
    const meta = response.meta || payload?.meta;

    discountCodes.value = Array.isArray(payload) ? payload : payload?.data || [];
    pagination.value = {
      current_page: meta?.current_page || payload?.current_page || 1,
      last_page: meta?.last_page || payload?.last_page || 1,
      per_page: meta?.per_page || payload?.per_page || defaultPagination.per_page,
      total: meta?.total || payload?.total || 0,
    };
  }

  async function fetchDiscountCodes() {
    loading.value = true;
    error.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(`${DISCOUNT_CODES.LIST}?${buildQueryString()}`);
      applyListResponse(response);
    } catch (err) {
      error.value = err.message || "Unable to load discount codes";
      discountCodes.value = [];
      pagination.value = { ...defaultPagination };
    } finally {
      loading.value = false;
    }
  }

  async function fetchDiscountCode(id) {
    detailLoading.value = true;
    detailError.value = "";
    discountCode.value = null;
    try {
      const api = useApiClient();
      const response = await api.get(DISCOUNT_CODES.SHOW(id));
      discountCode.value = response.data;
    } catch (err) {
      detailError.value = err.message || "Unable to load discount code";
    } finally {
      detailLoading.value = false;
    }
  }

  async function fetchStorefronts() {
    storefrontLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(`${CATEGORIES.LIST}?page=1&per_page=100&is_parent=1&is_active=1`);
      storefronts.value = (response.data || []).filter((category) => !category.parent_id);
    } finally {
      storefrontLoading.value = false;
    }
  }

  async function createDiscountCode(payload) {
    saving.value = true;
    try {
      const api = useApiClient();
      return await api.post(DISCOUNT_CODES.CREATE, payload);
    } finally {
      saving.value = false;
    }
  }

  async function updateDiscountCode(id, payload) {
    saving.value = true;
    try {
      const api = useApiClient();
      return await api.patch(DISCOUNT_CODES.UPDATE(id), payload);
    } finally {
      saving.value = false;
    }
  }

  async function activateDiscountCode(id) {
    actionLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.post(DISCOUNT_CODES.ACTIVATE(id));
      discountCode.value = response.data;
      return response;
    } finally {
      actionLoading.value = false;
    }
  }

  async function deactivateDiscountCode(id) {
    actionLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.post(DISCOUNT_CODES.DEACTIVATE(id));
      discountCode.value = response.data;
      return response;
    } finally {
      actionLoading.value = false;
    }
  }

  async function duplicateDiscountCode(id, code) {
    actionLoading.value = true;
    try {
      const api = useApiClient();
      return await api.post(DISCOUNT_CODES.DUPLICATE(id), { code });
    } finally {
      actionLoading.value = false;
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    pagination.value.current_page = 1;
    fetchDiscountCodes();
  }

  function setFilters(values) {
    filters.value = { ...filters.value, ...values };
    pagination.value.current_page = 1;
    fetchDiscountCodes();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchDiscountCodes();
  }

  function setSorting(field, order) {
    sorting.value.sort = field || "created_at";
    sorting.value.direction = order || "desc";
    pagination.value.current_page = 1;
    fetchDiscountCodes();
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
    pagination.value.current_page = 1;
    fetchDiscountCodes();
  }

  return {
    discountCodes,
    discountCode,
    storefronts,
    pagination,
    filters,
    sorting,
    loading,
    detailLoading,
    storefrontLoading,
    saving,
    actionLoading,
    error,
    detailError,
    fetchDiscountCodes,
    fetchDiscountCode,
    fetchStorefronts,
    createDiscountCode,
    updateDiscountCode,
    activateDiscountCode,
    deactivateDiscountCode,
    duplicateDiscountCode,
    setFilter,
    setFilters,
    setPage,
    setSorting,
    resetFilters,
  };
});
