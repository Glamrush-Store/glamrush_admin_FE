import { defineStore } from "pinia";
import { PRODUCTS, VARIANTS } from "~/constants/endpoints";

export const useProductStore = defineStore("product", () => {
  const products = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const filters = ref({
    search: "",
    type: null,
    status: null,
    category_id: null,
    brand_id: null,
    vendor_id: null,
    date_from: null,
    date_to: null,
  });
  const sorting = ref({
    sort_by: null,
    sort_dir: null,
  });
  const product = ref(null);
  const productLoading = ref(false);
  const loading = ref(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set("page", pagination.value.current_page);
    params.set("per_page", pagination.value.per_page);

    if (filters.value.search) params.set("search", filters.value.search);
    if (filters.value.type) params.set("type", filters.value.type);
    if (filters.value.status) params.set("status", filters.value.status);
    if (filters.value.category_id) params.set("category_id", filters.value.category_id);
    if (filters.value.brand_id) params.set("brand_id", filters.value.brand_id);
    if (filters.value.vendor_id) params.set("vendor_id", filters.value.vendor_id);
    if (filters.value.date_from) params.set("date_from", filters.value.date_from);
    if (filters.value.date_to) params.set("date_to", filters.value.date_to);

    if (sorting.value.sort_by) {
      params.set("sort_by", sorting.value.sort_by);
      params.set("sort_dir", sorting.value.sort_dir || "asc");
    }

    return params.toString();
  }

  async function fetchProducts() {
    loading.value = true;
    try {
      const api = useApiClient();
      const query = buildQueryString();
      const response = await api.get(`${PRODUCTS.LIST}?${query}`);
      products.value = response.data;
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
    fetchProducts();
  }

  function setPage(page) {
    pagination.value.current_page = page;
    fetchProducts();
  }

  function setSorting(field, order) {
    sorting.value.sort_by = field;
    sorting.value.sort_dir = order;
    fetchProducts();
  }

  async function fetchProduct(id) {
    productLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(PRODUCTS.SHOW(id));
      product.value = response.data;
    } finally {
      productLoading.value = false;
    }
  }

  async function deleteProduct(id) {
    const api = useApiClient();
    await api.del(PRODUCTS.SHOW(id));
    navigateTo("/products");
  }

  async function archiveProduct(id) {
    const api = useApiClient();
    await api.put(PRODUCTS.SHOW(id), { status: "archived" });
    await fetchProduct(id);
  }

  async function createProduct(formData) {
    const api = useApiClient();
    const response = await api.postFormData(PRODUCTS.CREATE, formData);
    return response;
  }

  async function updateProduct(id, data) {
    const api = useApiClient();
    return await api.put(PRODUCTS.UPDATE(id), data);
  }

  async function fetchVariant(variantId) {
    const api = useApiClient();
    const response = await api.get(VARIANTS.SHOW(variantId));
    return response;
  }

  async function updateVariant(variantId, formData) {
    const api = useApiClient();
    return await api.putFormData(VARIANTS.UPDATE(variantId), formData);
  }

  async function deleteVariant(variantId) {
    const api = useApiClient();
    await api.del(VARIANTS.DELETE(variantId));
  }

  function resetFilters() {
    filters.value = {
      search: "",
      type: null,
      status: null,
      category_id: null,
      brand_id: null,
      vendor_id: null,
      date_from: null,
      date_to: null,
    };
    pagination.value.current_page = 1;
    fetchProducts();
  }

  return {
    products,
    product,
    productLoading,
    pagination,
    filters,
    sorting,
    loading,
    fetchProducts,
    fetchProduct,
    deleteProduct,
    archiveProduct,
    createProduct,
    updateProduct,
    fetchVariant,
    updateVariant,
    deleteVariant,
    setFilter,
    setPage,
    setSorting,
    resetFilters,
  };
});
