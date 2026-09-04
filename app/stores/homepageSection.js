import { defineStore } from "pinia";
import { CATEGORIES, HOMEPAGE_SECTIONS, PRODUCTS } from "~/constants/endpoints";

const defaultFilters = {
  type: null,
  is_active: null,
  per_page: 50,
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

function unwrapList(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

export const useHomepageSectionStore = defineStore("homepageSection", () => {
  const sections = ref([]);
  const products = ref([]);
  const categories = ref([]);
  const filters = ref({ ...defaultFilters });
  const meta = ref(null);
  const loading = ref(false);
  const selectorLoading = ref(false);
  const actionLoading = ref(false);
  const reorderLoading = ref(false);
  const error = ref(null);

  async function fetchSections(overrides = {}) {
    filters.value = {
      ...filters.value,
      ...overrides,
    };
    loading.value = true;
    error.value = null;

    try {
      const api = useApiClient();
      const query = buildQuery(filters.value);
      const response = await api.get(`${HOMEPAGE_SECTIONS.LIST}?${query}`);
      sections.value = unwrapList(response).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      meta.value = response.meta || null;
      return response;
    } catch (err) {
      error.value = err.message || "Unable to load homepage sections";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSelectorOptions() {
    selectorLoading.value = true;

    try {
      const api = useApiClient();
      const [productResponse, categoryResponse] = await Promise.all([
        api.get(`${PRODUCTS.LIST}?per_page=500`),
        api.get(`${CATEGORIES.LIST}?per_page=500`),
      ]);

      products.value = unwrapList(productResponse);
      categories.value = unwrapList(categoryResponse);
    } finally {
      selectorLoading.value = false;
    }
  }

  async function createSection(payload) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.post(HOMEPAGE_SECTIONS.CREATE, payload);
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateSection(id, payload) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.put(HOMEPAGE_SECTIONS.UPDATE(id), payload);
    } finally {
      actionLoading.value = false;
    }
  }

  async function deleteSection(id) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.del(HOMEPAGE_SECTIONS.DELETE(id));
    } finally {
      actionLoading.value = false;
    }
  }

  async function reorderSections(orderedSections) {
    reorderLoading.value = true;

    try {
      const api = useApiClient();
      return await api.put(HOMEPAGE_SECTIONS.REORDER, {
        sections: orderedSections.map((section, index) => ({
          id: section.id,
          sort_order: index,
        })),
      });
    } finally {
      reorderLoading.value = false;
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    return fetchSections();
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
    return fetchSections();
  }

  return {
    sections,
    products,
    categories,
    filters,
    meta,
    loading,
    selectorLoading,
    actionLoading,
    reorderLoading,
    error,
    fetchSections,
    fetchSelectorOptions,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    setFilter,
    resetFilters,
  };
});
