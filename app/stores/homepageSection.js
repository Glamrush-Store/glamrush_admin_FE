import { defineStore } from "pinia";
import { CATEGORIES, COLLECTIONS, HOMEPAGE_SECTIONS, PRODUCTS } from "~/constants/endpoints";

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
  const sectionTypes = ref([]);
  const products = ref([]);
  const categories = ref([]);
  const collections = ref([]);
  const filters = ref({ ...defaultFilters });
  const meta = ref(null);
  const loading = ref(false);
  const typeLoading = ref(false);
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
      sections.value = unwrapList(response).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
      meta.value = response.meta || null;
      return response;
    } catch (err) {
      error.value = err.message || "Unable to load homepage sections";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSectionTypes() {
    typeLoading.value = true;

    try {
      const api = useApiClient();
      const response = await api.get(HOMEPAGE_SECTIONS.TYPES);
      sectionTypes.value = unwrapList(response);
      return response;
    } finally {
      typeLoading.value = false;
    }
  }

  async function fetchSelectorOptions() {
    selectorLoading.value = true;

    try {
      const api = useApiClient();
      const [productResponse, categoryResponse, collectionResponse] = await Promise.all([
        api.get(`${PRODUCTS.LIST}?per_page=500`),
        api.get(`${CATEGORIES.LIST}?per_page=500`),
        api.get(`${COLLECTIONS.LIST}?per_page=500`),
      ]);

      products.value = unwrapList(productResponse);
      categories.value = unwrapList(categoryResponse);
      collections.value = unwrapList(collectionResponse);
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

  async function enableSection(id) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.patch(HOMEPAGE_SECTIONS.ENABLE(id));
    } finally {
      actionLoading.value = false;
    }
  }

  async function disableSection(id) {
    actionLoading.value = true;

    try {
      const api = useApiClient();
      return await api.patch(HOMEPAGE_SECTIONS.DISABLE(id));
    } finally {
      actionLoading.value = false;
    }
  }

  async function reorderSections(orderedSections) {
    reorderLoading.value = true;

    try {
      const api = useApiClient();
      return await api.put(HOMEPAGE_SECTIONS.REORDER, {
        section_ids: orderedSections.map((section) => section.id),
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
    sectionTypes,
    products,
    categories,
    collections,
    filters,
    meta,
    loading,
    typeLoading,
    selectorLoading,
    actionLoading,
    reorderLoading,
    error,
    fetchSections,
    fetchSectionTypes,
    fetchSelectorOptions,
    createSection,
    updateSection,
    deleteSection,
    enableSection,
    disableSection,
    reorderSections,
    setFilter,
    resetFilters,
  };
});
