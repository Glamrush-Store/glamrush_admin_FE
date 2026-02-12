import { defineStore } from "pinia";
import { AUTH } from "~/constants/endpoints";

export const useAuthStore = defineStore("auth", () => {
  const token = useCookie("auth_token");
  const user = shallowRef(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(credentials) {
    const api = useApiClient();
    const response = await api.post(AUTH.LOGIN, credentials);
    token.value = response.data.access_token;
    await fetchUser(response.data.access_token);
  }

  async function fetchUser(authToken) {
    const api = useApiClient(authToken ? { authToken } : undefined);
    const response = await api.get(AUTH.WHO_AM_I);
    user.value = response.data;
  }

  async function logout() {
    const api = useApiClient();
    try {
      await api.post(AUTH.LOGOUT);
    } finally {
      token.value = null;
      user.value = null;
      navigateTo("/");
    }
  }

  return { token, user, isAuthenticated, login, fetchUser, logout };
});
