export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ["/", "/forgot-password", "/verify-code", "/reset-password"];
  const isPublic = publicRoutes.includes(to.path);
  const token = useCookie("auth_token");

  if (isPublic && token.value) {
    return navigateTo("/dashboard");
  }

  if (!isPublic && !token.value) {
    return navigateTo("/");
  }
});
