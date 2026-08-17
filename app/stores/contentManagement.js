import { defineStore } from "pinia";
import { CATEGORIES, CONTENT_PAGES, FAQ_CATEGORIES, FAQS } from "~/constants/endpoints";

const defaultPagination = (perPage = 20) => ({ current_page: 1, last_page: 1, per_page: perPage, total: 0 });

const defaultPageFilters = () => ({
  search: "",
  page_type: null,
  state: null,
  storefront_id: null,
  is_published: null,
  published_from: null,
  published_to: null,
  expires_from: null,
  expires_to: null,
});

const defaultFaqFilters = () => ({
  search: "",
  faq_category_id: null,
  state: null,
  storefront_id: null,
  is_published: null,
});

const defaultCategoryFilters = () => ({ search: "", is_active: null });

export const useContentManagementStore = defineStore("contentManagement", () => {
  const pages = ref([]);
  const page = ref(null);
  const faqs = ref([]);
  const faq = ref(null);
  const faqCategories = ref([]);
  const faqCategory = ref(null);
  const storefronts = ref([]);

  const pagePagination = ref(defaultPagination());
  const faqPagination = ref(defaultPagination());
  const categoryPagination = ref(defaultPagination(100));

  const pageFilters = ref(defaultPageFilters());
  const faqFilters = ref(defaultFaqFilters());
  const categoryFilters = ref(defaultCategoryFilters());
  const pageSorting = ref({ sort: "updated_at", direction: "desc" });
  const faqSorting = ref({ sort: "updated_at", direction: "desc" });

  const pagesLoading = ref(false);
  const pageLoading = ref(false);
  const faqsLoading = ref(false);
  const faqLoading = ref(false);
  const categoriesLoading = ref(false);
  const categoryLoading = ref(false);
  const storefrontsLoading = ref(false);
  const saving = ref(false);
  const mutating = ref(false);
  const reordering = ref(false);

  const pagesError = ref("");
  const pageError = ref("");
  const faqsError = ref("");
  const faqError = ref("");
  const categoriesError = ref("");
  const categoryError = ref("");
  const permissionDenied = ref({ pages: false, page: false, faqs: false, faq: false, categories: false });

  let pageRequestKey = 0;
  let faqRequestKey = 0;
  let categoryRequestKey = 0;

  function buildQuery(filters, sorting, pagination) {
    const params = new URLSearchParams();
    params.set("page", pagination.current_page);
    params.set("per_page", pagination.per_page);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) params.set(key, value);
    });

    if (sorting?.sort) {
      params.set("sort", sorting.sort);
      params.set("direction", sorting.direction === "asc" ? "asc" : "desc");
    }

    return params.toString();
  }

  function applyPagination(target, response, fallbackPerPage = 20) {
    const payload = response.data;
    const meta = response.meta || payload?.meta;
    target.value = {
      current_page: meta?.current_page || payload?.current_page || 1,
      last_page: meta?.last_page || payload?.last_page || 1,
      per_page: meta?.per_page || payload?.per_page || fallbackPerPage,
      total: meta?.total || payload?.total || 0,
    };
  }

  function listData(response) {
    const payload = response.data;
    return Array.isArray(payload) ? payload : payload?.data || [];
  }

  function setErrorState(errorRef, permissionKey, exception, fallback) {
    permissionDenied.value[permissionKey] = exception.status === 403;
    errorRef.value = exception.message || fallback;
  }

  async function fetchStorefronts() {
    storefrontsLoading.value = true;
    try {
      const response = await useApiClient().get(`${CATEGORIES.LIST}?page=1&per_page=100&is_parent=1&is_active=1`);
      storefronts.value = (response.data || []).filter((category) => !category.parent_id);
    } finally {
      storefrontsLoading.value = false;
    }
  }

  async function fetchPages() {
    const requestKey = ++pageRequestKey;
    pagesLoading.value = true;
    pagesError.value = "";
    permissionDenied.value.pages = false;
    try {
      const query = buildQuery(pageFilters.value, pageSorting.value, pagePagination.value);
      const response = await useApiClient().get(`${CONTENT_PAGES.LIST}?${query}`);
      if (requestKey !== pageRequestKey) return;
      pages.value = listData(response);
      applyPagination(pagePagination, response);
    } catch (exception) {
      if (requestKey !== pageRequestKey) return;
      pages.value = [];
      setErrorState(pagesError, "pages", exception, "Content pages could not be loaded.");
    } finally {
      if (requestKey === pageRequestKey) pagesLoading.value = false;
    }
  }

  async function fetchPage(id) {
    pageLoading.value = true;
    pageError.value = "";
    permissionDenied.value.page = false;
    page.value = null;
    try {
      const response = await useApiClient().get(CONTENT_PAGES.SHOW(id));
      page.value = response.data;
    } catch (exception) {
      setErrorState(pageError, "page", exception, "Content page could not be loaded.");
    } finally {
      pageLoading.value = false;
    }
  }

  async function savePage(payload, id = null) {
    saving.value = true;
    try {
      const api = useApiClient();
      return id ? await api.patch(CONTENT_PAGES.UPDATE(id), payload) : await api.post(CONTENT_PAGES.CREATE, payload);
    } finally {
      saving.value = false;
    }
  }

  async function publishPage(id) {
    mutating.value = true;
    try {
      const response = await useApiClient().post(CONTENT_PAGES.PUBLISH(id));
      page.value = response.data;
      return response;
    } finally {
      mutating.value = false;
    }
  }

  async function unpublishPage(id) {
    mutating.value = true;
    try {
      const response = await useApiClient().post(CONTENT_PAGES.UNPUBLISH(id));
      page.value = response.data;
      return response;
    } finally {
      mutating.value = false;
    }
  }

  async function duplicatePage(id, slug) {
    mutating.value = true;
    try {
      return await useApiClient().post(CONTENT_PAGES.DUPLICATE(id), { slug });
    } finally {
      mutating.value = false;
    }
  }

  async function deletePage(id) {
    mutating.value = true;
    try {
      return await useApiClient().del(CONTENT_PAGES.DELETE(id));
    } finally {
      mutating.value = false;
    }
  }

  async function fetchFaqCategories() {
    const requestKey = ++categoryRequestKey;
    categoriesLoading.value = true;
    categoriesError.value = "";
    permissionDenied.value.categories = false;
    try {
      const query = buildQuery(categoryFilters.value, null, categoryPagination.value);
      const response = await useApiClient().get(`${FAQ_CATEGORIES.LIST}?${query}`);
      if (requestKey !== categoryRequestKey) return;
      faqCategories.value = listData(response);
      applyPagination(categoryPagination, response, 100);
    } catch (exception) {
      if (requestKey !== categoryRequestKey) return;
      faqCategories.value = [];
      setErrorState(categoriesError, "categories", exception, "FAQ categories could not be loaded.");
    } finally {
      if (requestKey === categoryRequestKey) categoriesLoading.value = false;
    }
  }

  async function fetchFaqCategory(id) {
    categoryLoading.value = true;
    categoryError.value = "";
    try {
      const response = await useApiClient().get(FAQ_CATEGORIES.SHOW(id));
      faqCategory.value = response.data;
    } catch (exception) {
      categoryError.value = exception.message || "FAQ category could not be loaded.";
    } finally {
      categoryLoading.value = false;
    }
  }

  async function saveFaqCategory(payload, id = null) {
    saving.value = true;
    try {
      const api = useApiClient();
      return id ? await api.patch(FAQ_CATEGORIES.UPDATE(id), payload) : await api.post(FAQ_CATEGORIES.CREATE, payload);
    } finally {
      saving.value = false;
    }
  }

  async function deleteFaqCategory(id) {
    mutating.value = true;
    try {
      return await useApiClient().del(FAQ_CATEGORIES.DELETE(id));
    } finally {
      mutating.value = false;
    }
  }

  async function reorderFaqCategories(ids) {
    reordering.value = true;
    try {
      return await useApiClient().post(FAQ_CATEGORIES.REORDER, { ids });
    } finally {
      reordering.value = false;
    }
  }

  async function fetchFaqs() {
    const requestKey = ++faqRequestKey;
    faqsLoading.value = true;
    faqsError.value = "";
    permissionDenied.value.faqs = false;
    try {
      const query = buildQuery(faqFilters.value, faqSorting.value, faqPagination.value);
      const response = await useApiClient().get(`${FAQS.LIST}?${query}`);
      if (requestKey !== faqRequestKey) return;
      faqs.value = listData(response);
      applyPagination(faqPagination, response);
    } catch (exception) {
      if (requestKey !== faqRequestKey) return;
      faqs.value = [];
      setErrorState(faqsError, "faqs", exception, "FAQs could not be loaded.");
    } finally {
      if (requestKey === faqRequestKey) faqsLoading.value = false;
    }
  }

  async function fetchFaq(id) {
    faqLoading.value = true;
    faqError.value = "";
    permissionDenied.value.faq = false;
    faq.value = null;
    try {
      const response = await useApiClient().get(FAQS.SHOW(id));
      faq.value = response.data;
    } catch (exception) {
      setErrorState(faqError, "faq", exception, "FAQ could not be loaded.");
    } finally {
      faqLoading.value = false;
    }
  }

  async function saveFaq(payload, id = null) {
    saving.value = true;
    try {
      const api = useApiClient();
      return id ? await api.patch(FAQS.UPDATE(id), payload) : await api.post(FAQS.CREATE, payload);
    } finally {
      saving.value = false;
    }
  }

  async function publishFaq(id) {
    mutating.value = true;
    try {
      const response = await useApiClient().post(FAQS.PUBLISH(id));
      faq.value = response.data;
      return response;
    } finally {
      mutating.value = false;
    }
  }

  async function unpublishFaq(id) {
    mutating.value = true;
    try {
      const response = await useApiClient().post(FAQS.UNPUBLISH(id));
      faq.value = response.data;
      return response;
    } finally {
      mutating.value = false;
    }
  }

  async function duplicateFaq(id) {
    mutating.value = true;
    try {
      return await useApiClient().post(FAQS.DUPLICATE(id));
    } finally {
      mutating.value = false;
    }
  }

  async function deleteFaq(id) {
    mutating.value = true;
    try {
      return await useApiClient().del(FAQS.DELETE(id));
    } finally {
      mutating.value = false;
    }
  }

  async function reorderFaqs(ids) {
    reordering.value = true;
    try {
      return await useApiClient().post(FAQS.REORDER, { ids });
    } finally {
      reordering.value = false;
    }
  }

  function setPageFilters(values) {
    pageFilters.value = { ...pageFilters.value, ...values };
    pagePagination.value.current_page = 1;
    return fetchPages();
  }

  function setFaqFilters(values) {
    faqFilters.value = { ...faqFilters.value, ...values };
    faqPagination.value.current_page = 1;
    return fetchFaqs();
  }

  function setCategoryFilters(values) {
    categoryFilters.value = { ...categoryFilters.value, ...values };
    categoryPagination.value.current_page = 1;
    return fetchFaqCategories();
  }

  function resetPageFilters() {
    pageFilters.value = defaultPageFilters();
    pagePagination.value.current_page = 1;
    return fetchPages();
  }

  function resetFaqFilters() {
    faqFilters.value = defaultFaqFilters();
    faqPagination.value.current_page = 1;
    return fetchFaqs();
  }

  function resetCategoryFilters() {
    categoryFilters.value = defaultCategoryFilters();
    categoryPagination.value.current_page = 1;
    return fetchFaqCategories();
  }

  function setPagePage(pageNumber, rows = pagePagination.value.per_page) {
    pagePagination.value.current_page = pageNumber;
    pagePagination.value.per_page = rows;
    return fetchPages();
  }

  function setFaqPage(pageNumber, rows = faqPagination.value.per_page) {
    faqPagination.value.current_page = pageNumber;
    faqPagination.value.per_page = rows;
    return fetchFaqs();
  }

  function setCategoryPage(pageNumber, rows = categoryPagination.value.per_page) {
    categoryPagination.value.current_page = pageNumber;
    categoryPagination.value.per_page = rows;
    return fetchFaqCategories();
  }

  function setPageSorting(field, direction) {
    pageSorting.value = { sort: field || "updated_at", direction: direction === "asc" ? "asc" : "desc" };
    pagePagination.value.current_page = 1;
    return fetchPages();
  }

  function setFaqSorting(field, direction) {
    faqSorting.value = { sort: field || "updated_at", direction: direction === "asc" ? "asc" : "desc" };
    faqPagination.value.current_page = 1;
    return fetchFaqs();
  }

  return {
    pages,
    page,
    faqs,
    faq,
    faqCategories,
    faqCategory,
    storefronts,
    pagePagination,
    faqPagination,
    categoryPagination,
    pageFilters,
    faqFilters,
    categoryFilters,
    pageSorting,
    faqSorting,
    pagesLoading,
    pageLoading,
    faqsLoading,
    faqLoading,
    categoriesLoading,
    categoryLoading,
    storefrontsLoading,
    saving,
    mutating,
    reordering,
    pagesError,
    pageError,
    faqsError,
    faqError,
    categoriesError,
    categoryError,
    permissionDenied,
    fetchStorefronts,
    fetchPages,
    fetchPage,
    savePage,
    publishPage,
    unpublishPage,
    duplicatePage,
    deletePage,
    fetchFaqCategories,
    fetchFaqCategory,
    saveFaqCategory,
    deleteFaqCategory,
    reorderFaqCategories,
    fetchFaqs,
    fetchFaq,
    saveFaq,
    publishFaq,
    unpublishFaq,
    duplicateFaq,
    deleteFaq,
    reorderFaqs,
    setPageFilters,
    setFaqFilters,
    setCategoryFilters,
    resetPageFilters,
    resetFaqFilters,
    resetCategoryFilters,
    setPagePage,
    setFaqPage,
    setCategoryPage,
    setPageSorting,
    setFaqSorting,
  };
});
