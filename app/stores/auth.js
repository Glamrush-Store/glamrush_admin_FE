import { defineStore } from "pinia";
import { AUTH } from "~/constants/endpoints";
import { SESSION_ACTIVITY_STORAGE_KEY } from "~/constants/session";

export const useAuthStore = defineStore("auth", () => {
  const token = useCookie("auth_token");
  const user = shallowRef(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(credentials) {
    const api = useApiClient();
    const response = await api.post(AUTH.LOGIN, credentials);
    token.value = response.data.access_token;
    if (import.meta.client) {
      window.localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY, String(Date.now()));
    }
    await fetchUser(response.data.access_token);
  }

  async function fetchUser(authToken) {
    const api = useApiClient(authToken ? { authToken } : undefined);
    const response = await api.get(AUTH.WHO_AM_I);
    user.value = response.data;
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    if (import.meta.client) {
      window.localStorage.removeItem(SESSION_ACTIVITY_STORAGE_KEY);
    }
  }

  async function logout() {
    const api = useApiClient();
    try {
      await api.post(AUTH.LOGOUT);
    } finally {
      clearSession();
      navigateTo("/");
    }
  }

  return { token, user, isAuthenticated, login, fetchUser, clearSession, logout };
});
