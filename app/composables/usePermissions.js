export function usePermissions() {
  const authStore = useAuthStore();

  const rawPermissions = computed(() => {
    const user = authStore.user || {};
    return user.permissions || user.permission_names || user.all_permissions || null;
  });

  const hasPermissionPayload = computed(() => {
    if (Array.isArray(rawPermissions.value)) return rawPermissions.value.length > 0;
    if (rawPermissions.value && typeof rawPermissions.value === "object") {
      return Object.keys(rawPermissions.value).length > 0;
    }
    return false;
  });

  const permissions = computed(() => {
    if (Array.isArray(rawPermissions.value)) {
      return rawPermissions.value
        .map((permission) => (typeof permission === "string" ? permission : permission?.name))
        .filter(Boolean);
    }

    if (rawPermissions.value && typeof rawPermissions.value === "object") {
      return Object.values(rawPermissions.value)
        .flat()
        .map((permission) => (typeof permission === "string" ? permission : permission?.name))
        .filter(Boolean);
    }

    return [];
  });

  function can(permission) {
    if (!permission) return true;
    if (!hasPermissionPayload.value) return true;
    return permissions.value.includes(permission);
  }

  return { permissions, hasPermissionPayload, can };
}
