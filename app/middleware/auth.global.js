import {
  SESSION_ACTIVITY_STORAGE_KEY,
  SESSION_INACTIVITY_TIMEOUT_MS,
} from "~/constants/session";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ["/", "/forgot-password", "/verify-code", "/reset-password"];
  const isPublic = publicRoutes.includes(to.path);
  const token = useCookie("auth_token");
  const authStore = useAuthStore();

  function isIdleSessionExpired() {
    if (!import.meta.client || !token.value) return false;

    const storedValue = Number(window.localStorage.getItem(SESSION_ACTIVITY_STORAGE_KEY));
    if (!Number.isFinite(storedValue) || storedValue <= 0) {
      window.localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY, String(Date.now()));
      return false;
    }

    return Date.now() - storedValue >= SESSION_INACTIVITY_TIMEOUT_MS;
  }

  function recordRouteActivity() {
    if (import.meta.client && token.value) {
      window.localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY, String(Date.now()));
    }
  }

  if (isIdleSessionExpired()) {
    authStore.clearSession();
    return isPublic ? undefined : navigateTo("/");
  }

  if (isPublic && token.value) {
    recordRouteActivity();
    return navigateTo("/dashboard");
  }

  if (!isPublic && !token.value) {
    return navigateTo("/");
  }

  if (!isPublic && token.value && !authStore.user) {
    try {
      await authStore.fetchUser();
    } catch {
      token.value = null;
      return navigateTo("/");
    }
  }

  if (!isPublic && token.value) {
    recordRouteActivity();
  }
});
