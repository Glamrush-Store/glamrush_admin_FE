import { defineStore } from "pinia";
import { SITE_SETTINGS } from "~/constants/endpoints";

export const useSiteSettingStore = defineStore("siteSetting", () => {
  const categories = ref([]);
  const settings = ref([]);
  const meta = ref(null);
  const loadingCategories = ref(false);
  const loadingSettings = ref(false);

  async function fetchCategories(params = {}) {
    loadingCategories.value = true;
    try {
      const api = useApiClient();
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") query.append(key, value);
      });
      const suffix = query.toString() ? `?${query}` : "";
      const response = await api.get(`${SITE_SETTINGS.CATEGORIES.LIST}${suffix}`);
      categories.value = response.data;
      return response;
    } finally {
      loadingCategories.value = false;
    }
  }

  async function fetchSettings(params = {}) {
    loadingSettings.value = true;
    try {
      const api = useApiClient();
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") query.append(key, value);
      });
      const suffix = query.toString() ? `?${query}` : "";
      const response = await api.get(`${SITE_SETTINGS.LIST}${suffix}`);
      settings.value = response.data;
      meta.value = response.meta;
      return response;
    } finally {
      loadingSettings.value = false;
    }
  }

  async function createCategory(data) {
    const api = useApiClient();
    return await api.post(SITE_SETTINGS.CATEGORIES.CREATE, data);
  }

  async function updateCategory(id, data) {
    const api = useApiClient();
    return await api.patch(SITE_SETTINGS.CATEGORIES.UPDATE(id), data);
  }

  async function deleteCategory(id) {
    const api = useApiClient();
    await api.del(SITE_SETTINGS.CATEGORIES.DELETE(id));
    categories.value = categories.value.filter((category) => category.id !== id);
  }

  async function createSetting(data) {
    const api = useApiClient();
    return await api.post(SITE_SETTINGS.CREATE, data);
  }

  async function updateSetting(id, data) {
    const api = useApiClient();
    return await api.patch(SITE_SETTINGS.UPDATE(id), data);
  }

  async function deleteSetting(id) {
    const api = useApiClient();
    await api.del(SITE_SETTINGS.DELETE(id));
    settings.value = settings.value.filter((setting) => setting.id !== id);
  }

  return {
    categories,
    settings,
    meta,
    loadingCategories,
    loadingSettings,
    fetchCategories,
    fetchSettings,
    createCategory,
    updateCategory,
    deleteCategory,
    createSetting,
    updateSetting,
    deleteSetting,
  };
});
