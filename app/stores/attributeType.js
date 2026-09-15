import { defineStore } from "pinia";
import { ATTRIBUTE_TYPES } from "~/constants/endpoints";
import {
  normalizeAttributeTypeSortDir,
  normalizeAttributeTypeSortField,
} from "~/constants/attributeTypes";

function normalizePagination(meta = {}) {
  return {
    current_page: Number(meta.current_page ?? meta.page ?? 1),
    last_page: Number(meta.last_page ?? meta.total_pages ?? 1),
    per_page: Number(meta.per_page ?? 15),
    total: Number(meta.total ?? 0),
  };
}

export const useAttributeTypeStore = defineStore("attributeType", () => {
  const attributeTypes = ref([]);
  const attributeType = ref(null);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const filters = ref({
    search: "",
    category: "",
  });
  const sorting = ref({
    sort_by: "value",
    sort_dir: "asc",
  });
  const loading = ref(false);
  const detailLoading = ref(false);
  const actionLoading = ref(false);
  const error = ref("");

  const categoryOptions = computed(() => {
    const categories = attributeTypes.value
      .map((type) => type.category)
      .filter(Boolean);

    return [...new Set(categories)]
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({ label: category, value: category }));
  });

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    const search = filters.value.search?.trim();
    const category = filters.value.category?.trim();

    if (search) params.set("search", search);
    if (category) params.set("category", category);

    params.set("sort_by", normalizeAttributeTypeSortField(sorting.value.sort_by));
    params.set("sort_dir", normalizeAttributeTypeSortDir(sorting.value.sort_dir));

    return params.toString();
  }

  async function fetchAttributeTypes() {
    loading.value = true;
    error.value = "";

    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${ATTRIBUTE_TYPES.LIST}?${query}`);
      attributeTypes.value = response.data ?? [];
      pagination.value = normalizePagination(response.meta);
    } catch (e) {
      attributeTypes.value = [];
      error.value = e?.message || "Unable to load attribute types.";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAttributeType(id) {
    detailLoading.value = true;
    error.value = "";

    try {
      const api = useApiClient();
      const response = await api.get(ATTRIBUTE_TYPES.SHOW(id));
      attributeType.value = response.data ?? null;
      return attributeType.value;
    } catch (e) {
      error.value = e?.message || "Unable to load attribute type.";
      throw e;
    } finally {
      detailLoading.value = false;
    }
  }

  async function createAttributeType(payload) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.post(ATTRIBUTE_TYPES.CREATE, payload);
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateAttributeType(id, payload) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.patch(ATTRIBUTE_TYPES.UPDATE(id), payload);
    } finally {
      actionLoading.value = false;
    }
  }

  async function deleteAttributeType(id) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      await api.del(ATTRIBUTE_TYPES.DELETE(id));
      await fetchAttributeTypes();
    } finally {
      actionLoading.value = false;
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value ?? "";
    pagination.value.current_page = 1;
    return fetchAttributeTypes();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    return fetchAttributeTypes();
  }

  function setPerPage(perPage) {
    pagination.value.per_page = Math.min(Math.max(Number(perPage) || 15, 1), 100);
    pagination.value.current_page = 1;
    return fetchAttributeTypes();
  }

  function setPagination(page, perPage) {
    pagination.value.per_page = Math.min(Math.max(Number(perPage) || 15, 1), 100);
    pagination.value.current_page = page;
    return fetchAttributeTypes();
  }

  function setSorting(field, direction) {
    sorting.value.sort_by = normalizeAttributeTypeSortField(field);
    sorting.value.sort_dir = normalizeAttributeTypeSortDir(direction);
    pagination.value.current_page = 1;
    return fetchAttributeTypes();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      category: "",
    };
    pagination.value.current_page = 1;
    return fetchAttributeTypes();
  }

  return {
    attributeTypes,
    attributeType,
    pagination,
    filters,
    sorting,
    loading,
    detailLoading,
    actionLoading,
    error,
    categoryOptions,
    fetchAttributeTypes,
    fetchAttributeType,
    createAttributeType,
    updateAttributeType,
    deleteAttributeType,
    setFilter,
    setPage,
    setPerPage,
    setPagination,
    setSorting,
    resetFilters,
  };
});
