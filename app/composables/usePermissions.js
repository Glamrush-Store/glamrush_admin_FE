export function usePermissions() {
  const authStore = useAuthStore();

  function normalizePermissions(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value
        .flatMap((permission) => {
          if (typeof permission === "string") return permission;
          if (permission?.name) return permission.name;
          if (permission?.permissions) return normalizePermissions(permission.permissions);
          return [];
        })
        .filter(Boolean);
    }

    if (typeof value === "object") {
      return Object.values(value)
        .flatMap((permission) => {
          if (typeof permission === "string") return permission;
          if (permission?.name) return permission.name;
          if (permission?.permissions) return normalizePermissions(permission.permissions);
          return normalizePermissions(permission);
        })
        .filter(Boolean);
    }

    return [];
  }

  const rawPermissionSources = computed(() => {
    const user = authStore.user || {};
    return [
      user.permissions,
      user.permission_names,
      user.all_permissions,
      user.role?.permissions,
      user.roles,
    ];
  });

  const hasPermissionPayload = computed(() => {
    const user = authStore.user || null;
    if (!user) return false;

    return rawPermissionSources.value.some((source) => {
      if (Array.isArray(source)) return true;
      if (source && typeof source === "object") return Object.keys(source).length > 0;
      return source !== null && source !== undefined;
    });
  });

  const permissions = computed(() => {
    return [...new Set(rawPermissionSources.value.flatMap(normalizePermissions))];
  });

  function can(permission) {
    if (!permission) return true;
    if (!authStore.user) return false;
    if (!hasPermissionPayload.value) return false;
    return permissions.value.includes(permission);
  }

  return { permissions, hasPermissionPayload, can };
}
