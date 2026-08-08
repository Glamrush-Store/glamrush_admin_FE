import { defineStore } from "pinia";
import { CATEGORIES, STOREFRONT_CAMPAIGNS } from "~/constants/endpoints";

export const useStorefrontCampaignStore = defineStore("storefrontCampaign", () => {
  const storefronts = ref([]);
  const selectedStorefront = ref("");
  const campaigns = ref([]);
  const campaign = ref(null);
  const loading = ref(false);
  const storefrontLoading = ref(false);
  const campaignLoading = ref(false);
  const saving = ref(false);
  const error = ref("");
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  function normalizeMeta(meta = {}) {
    pagination.value = {
      current_page: meta.current_page || 1,
      last_page: meta.last_page || 1,
      per_page: meta.per_page || 20,
      total: meta.total || 0,
    };
  }

  async function fetchStorefronts() {
    storefrontLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(`${CATEGORIES.LIST}?page=1&per_page=100&is_parent=1&is_active=1`);
      storefronts.value = (response.data || []).filter((category) => !category.parent_id);

      if (!selectedStorefront.value && storefronts.value.length) {
        selectedStorefront.value = storefronts.value[0].slug;
      }
    } finally {
      storefrontLoading.value = false;
    }
  }

  async function fetchCampaigns(page = pagination.value.current_page) {
    if (!selectedStorefront.value) {
      campaigns.value = [];
      normalizeMeta();
      return;
    }

    loading.value = true;
    error.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(`${STOREFRONT_CAMPAIGNS.LIST(selectedStorefront.value)}?page=${page}`);
      campaigns.value = response.data || [];
      normalizeMeta(response.meta);
    } catch (e) {
      error.value = e.message || "Failed to load campaigns";
    } finally {
      loading.value = false;
    }
  }

  async function setStorefront(storefront) {
    selectedStorefront.value = storefront || "";
    pagination.value.current_page = 1;
    await fetchCampaigns(1);
  }

  async function setPage(page) {
    pagination.value.current_page = page;
    await fetchCampaigns(page);
  }

  async function fetchCampaign(storefront, id) {
    campaignLoading.value = true;
    error.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(STOREFRONT_CAMPAIGNS.SHOW(storefront, id));
      campaign.value = response.data;
    } catch (e) {
      error.value = e.message || "Failed to load campaign";
      campaign.value = null;
    } finally {
      campaignLoading.value = false;
    }
  }

  async function createCampaign(storefront, formData) {
    saving.value = true;
    try {
      const api = useApiClient();
      return await api.postFormData(STOREFRONT_CAMPAIGNS.CREATE(storefront), formData);
    } finally {
      saving.value = false;
    }
  }

  async function updateCampaign(storefront, id, formData) {
    saving.value = true;
    try {
      const api = useApiClient();
      return await api.putFormData(STOREFRONT_CAMPAIGNS.UPDATE(storefront, id), formData);
    } finally {
      saving.value = false;
    }
  }

  async function deleteCampaign(storefront, id) {
    const api = useApiClient();
    await api.del(STOREFRONT_CAMPAIGNS.DELETE(storefront, id));
  }

  async function enableCampaign(storefront, id) {
    const api = useApiClient();
    return await api.patch(STOREFRONT_CAMPAIGNS.ENABLE(storefront, id), {});
  }

  async function disableCampaign(storefront, id) {
    const api = useApiClient();
    return await api.patch(STOREFRONT_CAMPAIGNS.DISABLE(storefront, id), {});
  }

  return {
    storefronts,
    selectedStorefront,
    campaigns,
    campaign,
    loading,
    storefrontLoading,
    campaignLoading,
    saving,
    error,
    pagination,
    fetchStorefronts,
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    enableCampaign,
    disableCampaign,
    setStorefront,
    setPage,
  };
});
