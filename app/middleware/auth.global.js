export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ["/", "/forgot-password", "/verify-code", "/reset-password"];
  const isPublic = publicRoutes.includes(to.path);
  const token = useCookie("auth_token");
  const authStore = useAuthStore();

  if (isPublic && token.value) {
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
});
