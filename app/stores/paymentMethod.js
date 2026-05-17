import { defineStore } from "pinia";
import { PAYMENT_METHODS } from "~/constants/endpoints";

export const usePaymentMethodStore = defineStore("paymentMethod", () => {
  const methods = ref([]);
  const method = ref(null);
  const loading = ref(false);
  const methodLoading = ref(false);

  async function fetchPaymentMethods() {
    loading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(PAYMENT_METHODS.LIST);
      methods.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPaymentMethod(id) {
    methodLoading.value = true;
    try {
      const api = useApiClient();
      const response = await api.get(PAYMENT_METHODS.SHOW(id));
      method.value = response.data;
    } finally {
      methodLoading.value = false;
    }
  }

  async function createPaymentMethod(data) {
    const api = useApiClient();
    return await api.post(PAYMENT_METHODS.CREATE, data);
  }

  async function updatePaymentMethod(id, data) {
    const api = useApiClient();
    return await api.put(PAYMENT_METHODS.UPDATE(id), data);
  }

  async function deletePaymentMethod(id) {
    const api = useApiClient();
    await api.del(PAYMENT_METHODS.DELETE(id));
    methods.value = methods.value.filter((m) => m.id !== id);
  }

  return {
    methods, method, loading, methodLoading,
    fetchPaymentMethods, fetchPaymentMethod,
    createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  };
});
