import { defineStore } from "pinia";
import { COLLECTIONS } from "~/constants/endpoints";

export const useCollectionStore = defineStore("collection", () => {
  const collections = ref([]);
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
  const collection = ref(null);
  const collectionLoading = ref(false);
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

  async function fetchCollections() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${COLLECTIONS.LIST}?${query}`);
      collections.value = response.data;
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
    fetchCollections();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchCollections();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchCollections();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      is_active: null,
    };
    pagination.value.current_page = 1;
    fetchCollections();
  }

  async function fetchCollection(id) {
    collectionLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(COLLECTIONS.SHOW(id));
      collection.value = response.data;
    } finally {
      collectionLoading.value = false;
    }
  }

  async function createCollection(formData) {
    const api = useApiClient();
    return await api.postFormData(COLLECTIONS.CREATE, formData);
  }

  async function updateCollection(id, formData) {
    const api = useApiClient();
    return await api.putFormData(COLLECTIONS.UPDATE(id), formData);
  }

  async function deleteCollection(id) {
    const api = useApiClient();
    await api.del(COLLECTIONS.DELETE(id));
  }

  async function syncProducts(id, products) {
    const api = useApiClient();
    return await api.post(COLLECTIONS.SYNC_PRODUCTS(id), { products });
  }

  async function removeProduct(collectionId, productId) {
    const api = useApiClient();
    await api.del(COLLECTIONS.REMOVE_PRODUCT(collectionId, productId));
  }

  return {
    collections,
    collection,
    collectionLoading,
    pagination,
    filters,
    sorting,
    loading,
    fetchCollections,
    fetchCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    syncProducts,
    removeProduct,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
