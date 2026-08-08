import { defineStore } from "pinia";
import { CATEGORIES } from "~/constants/endpoints";

export const DEFAULT_ANNOUNCEMENT_PRIMARY = "Free Lagos delivery on orders over ₦100,000";
export const DEFAULT_ANNOUNCEMENT_SECONDARY = "Complimentary scent consultation";

export const useStorefrontAnnouncementStore = defineStore("storefrontAnnouncement", () => {
  const storefronts = ref([]);
  const selectedStorefrontId = shallowRef("");
  const announcement = ref({
    announcement_primary_text: "",
    announcement_secondary_text: "",
  });
  const loading = shallowRef(false);
  const storefrontLoading = shallowRef(false);
  const saving = shallowRef(false);
  const error = shallowRef("");
  const validationErrors = ref({});

  function clearErrors() {
    error.value = "";
    validationErrors.value = {};
  }

  function normalizeAnnouncement(category = {}) {
    return {
      announcement_primary_text: category.announcement_primary_text ?? null,
      announcement_secondary_text: category.announcement_secondary_text ?? null,
    };
  }

  async function fetchStorefronts() {
    storefrontLoading.value = true;
    clearErrors();

    try {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        is_active: "1",
      });
      const response = await useApiClient().get(`${CATEGORIES.LIST}?${params.toString()}`);
      storefronts.value = (response.data || []).filter((category) => !category.parent_name);
      return storefronts.value;
    } catch (exception) {
      error.value = exception.message || "Storefronts could not be loaded.";
      storefronts.value = [];
      return [];
    } finally {
      storefrontLoading.value = false;
    }
  }

  async function fetchAnnouncement(categoryId) {
    if (!categoryId) return null;

    loading.value = true;
    clearErrors();

    try {
      const response = await useApiClient().get(CATEGORIES.SHOW(categoryId));
      const category = response.data;

      if (category?.parent_id) {
        throw new Error("Select a root storefront category to manage header announcements.");
      }

      announcement.value = normalizeAnnouncement(category);
      return category;
    } catch (exception) {
      error.value = exception.message || "Announcement details could not be loaded.";
      announcement.value = normalizeAnnouncement();
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function selectStorefront(categoryId) {
    selectedStorefrontId.value = categoryId || "";

    if (!selectedStorefrontId.value) {
      announcement.value = normalizeAnnouncement();
      return null;
    }

    return await fetchAnnouncement(selectedStorefrontId.value);
  }

  async function updateAnnouncement(categoryId, payload) {
    saving.value = true;
    clearErrors();

    try {
      const response = await useApiClient().put(CATEGORIES.UPDATE(categoryId), payload);
      announcement.value = normalizeAnnouncement(response.data);
      return response;
    } catch (exception) {
      if (exception.status === 422 && exception.errors) {
        validationErrors.value = exception.errors;
      } else {
        error.value = exception.message || "Announcement could not be saved.";
      }
      throw exception;
    } finally {
      saving.value = false;
    }
  }

  return {
    storefronts,
    selectedStorefrontId,
    announcement,
    loading,
    storefrontLoading,
    saving,
    error,
    validationErrors,
    fetchStorefronts,
    selectStorefront,
    fetchAnnouncement,
    updateAnnouncement,
  };
});
