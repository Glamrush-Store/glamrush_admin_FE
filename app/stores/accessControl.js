import { defineStore } from "pinia";
import { PERMISSIONS, ROLES, USERS } from "~/constants/endpoints";

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

const defaultUserFilters = {
  search: "",
  role_id: null,
};

const defaultRoleFilters = {
  search: "",
};

function unwrapList(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function unwrapMeta(response, fallback = {}) {
  return response?.meta || response?.data?.meta || fallback;
}

function unwrapItem(response) {
  return response?.data?.data || response?.data || null;
}

function applyPagination(meta, fallback = defaultPagination) {
  return {
    current_page: meta?.current_page || fallback.current_page || 1,
    last_page: meta?.last_page || fallback.last_page || 1,
    per_page: meta?.per_page || fallback.per_page || 20,
    total: meta?.total || 0,
  };
}

export const useAccessControlStore = defineStore("accessControl", () => {
  const users = ref([]);
  const user = ref(null);
  const userPagination = ref({ ...defaultPagination });
  const userFilters = ref({ ...defaultUserFilters });
  const userSorting = ref({ sort: "created_at", direction: "desc" });
  const usersLoading = ref(false);
  const userLoading = ref(false);
  const userSaving = ref(false);
  const userDeleting = ref(false);
  const usersError = ref("");
  const userError = ref("");

  const roles = ref([]);
  const role = ref(null);
  const rolePagination = ref({ ...defaultPagination });
  const roleFilters = ref({ ...defaultRoleFilters });
  const roleSorting = ref({ sort: "created_at", direction: "desc" });
  const rolesLoading = ref(false);
  const roleLoading = ref(false);
  const roleSaving = ref(false);
  const roleDeleting = ref(false);
  const rolesError = ref("");
  const roleError = ref("");

  const permissions = ref([]);
  const permissionsLoading = ref(false);
  const permissionsError = ref("");

  function buildQuery({ pagination, filters, sorting }) {
    const params = new URLSearchParams();
    params.set("page", pagination.current_page);
    params.set("per_page", pagination.per_page);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") params.set(key, value);
    });
    if (sorting.sort) {
      params.set("sort", sorting.sort);
      params.set("direction", sorting.direction || "desc");
    }
    return params.toString();
  }

  async function fetchUsers() {
    usersLoading.value = true;
    usersError.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(`${USERS.LIST}?${buildQuery({
        pagination: userPagination.value,
        filters: userFilters.value,
        sorting: userSorting.value,
      })}`);
      users.value = unwrapList(response);
      userPagination.value = applyPagination(unwrapMeta(response), userPagination.value);
    } catch (error) {
      usersError.value = error.status === 403 ? "You do not have permission to view users." : error.message || "Unable to load users";
      users.value = [];
      userPagination.value = { ...defaultPagination };
    } finally {
      usersLoading.value = false;
    }
  }

  async function fetchUser(id) {
    userLoading.value = true;
    userError.value = "";
    user.value = null;
    try {
      const api = useApiClient();
      const response = await api.get(USERS.SHOW(id));
      user.value = unwrapItem(response);
    } catch (error) {
      userError.value = error.status === 403 ? "You do not have permission to view this user." : error.message || "Unable to load user";
    } finally {
      userLoading.value = false;
    }
  }

  async function createUser(payload) {
    userSaving.value = true;
    try {
      const api = useApiClient();
      return await api.post(USERS.CREATE, payload);
    } finally {
      userSaving.value = false;
    }
  }

  async function updateUser(id, payload) {
    userSaving.value = true;
    try {
      const api = useApiClient();
      const response = await api.patch(USERS.UPDATE(id), payload);
      user.value = unwrapItem(response);
      return response;
    } finally {
      userSaving.value = false;
    }
  }

  async function deleteUser(id) {
    userDeleting.value = true;
    try {
      const api = useApiClient();
      return await api.del(USERS.DELETE(id));
    } finally {
      userDeleting.value = false;
    }
  }

  function setUserFilters(filters) {
    userFilters.value = { ...userFilters.value, ...filters };
    userPagination.value.current_page = 1;
    fetchUsers();
  }

  function setUserPage(page, perPage = userPagination.value.per_page) {
    userPagination.value.current_page = page;
    userPagination.value.per_page = perPage;
    fetchUsers();
  }

  function setUserSorting(sort, direction) {
    userSorting.value = { sort: sort || "created_at", direction: direction || "desc" };
    userPagination.value.current_page = 1;
    fetchUsers();
  }

  function resetUserFilters() {
    userFilters.value = { ...defaultUserFilters };
    userPagination.value.current_page = 1;
    fetchUsers();
  }

  async function fetchRoles() {
    rolesLoading.value = true;
    rolesError.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(`${ROLES.LIST}?${buildQuery({
        pagination: rolePagination.value,
        filters: roleFilters.value,
        sorting: roleSorting.value,
      })}`);
      roles.value = unwrapList(response);
      rolePagination.value = applyPagination(unwrapMeta(response), rolePagination.value);
    } catch (error) {
      rolesError.value = error.status === 403 ? "You do not have permission to view roles." : error.message || "Unable to load roles";
      roles.value = [];
      rolePagination.value = { ...defaultPagination };
    } finally {
      rolesLoading.value = false;
    }
  }

  async function fetchRole(id) {
    roleLoading.value = true;
    roleError.value = "";
    role.value = null;
    try {
      const api = useApiClient();
      const response = await api.get(ROLES.SHOW(id));
      role.value = unwrapItem(response);
    } catch (error) {
      roleError.value = error.status === 403 ? "You do not have permission to view this role." : error.message || "Unable to load role";
    } finally {
      roleLoading.value = false;
    }
  }

  async function fetchRoleOptions() {
    const previous = { ...rolePagination.value };
    rolePagination.value = { current_page: 1, last_page: 1, per_page: 100, total: 0 };
    try {
      await fetchRoles();
    } finally {
      rolePagination.value = previous;
    }
  }

  async function createRole(payload) {
    roleSaving.value = true;
    try {
      const api = useApiClient();
      return await api.post(ROLES.CREATE, payload);
    } finally {
      roleSaving.value = false;
    }
  }

  async function updateRole(id, payload) {
    roleSaving.value = true;
    try {
      const api = useApiClient();
      const response = await api.patch(ROLES.UPDATE(id), payload);
      role.value = unwrapItem(response);
      return response;
    } finally {
      roleSaving.value = false;
    }
  }

  async function syncRolePermissions(id, permissions) {
    roleSaving.value = true;
    try {
      const api = useApiClient();
      const response = await api.put(ROLES.SYNC_PERMISSIONS(id), { permissions });
      role.value = unwrapItem(response) || role.value;
      return response;
    } finally {
      roleSaving.value = false;
    }
  }

  async function deleteRole(id) {
    roleDeleting.value = true;
    try {
      const api = useApiClient();
      return await api.del(ROLES.DELETE(id));
    } finally {
      roleDeleting.value = false;
    }
  }

  function setRoleFilters(filters) {
    roleFilters.value = { ...roleFilters.value, ...filters };
    rolePagination.value.current_page = 1;
    fetchRoles();
  }

  function setRolePage(page, perPage = rolePagination.value.per_page) {
    rolePagination.value.current_page = page;
    rolePagination.value.per_page = perPage;
    fetchRoles();
  }

  function setRoleSorting(sort, direction) {
    roleSorting.value = { sort: sort || "created_at", direction: direction || "desc" };
    rolePagination.value.current_page = 1;
    fetchRoles();
  }

  function resetRoleFilters() {
    roleFilters.value = { ...defaultRoleFilters };
    rolePagination.value.current_page = 1;
    fetchRoles();
  }

  async function fetchPermissions() {
    permissionsLoading.value = true;
    permissionsError.value = "";
    try {
      const api = useApiClient();
      const response = await api.get(PERMISSIONS.LIST);
      permissions.value = unwrapList(response);
    } catch (error) {
      permissionsError.value = error.status === 403 ? "You do not have permission to view permissions." : error.message || "Unable to load permissions";
      permissions.value = [];
    } finally {
      permissionsLoading.value = false;
    }
  }

  return {
    users,
    user,
    userPagination,
    userFilters,
    userSorting,
    usersLoading,
    userLoading,
    userSaving,
    userDeleting,
    usersError,
    userError,
    roles,
    role,
    rolePagination,
    roleFilters,
    roleSorting,
    rolesLoading,
    roleLoading,
    roleSaving,
    roleDeleting,
    rolesError,
    roleError,
    permissions,
    permissionsLoading,
    permissionsError,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    setUserFilters,
    setUserPage,
    setUserSorting,
    resetUserFilters,
    fetchRoles,
    fetchRole,
    fetchRoleOptions,
    createRole,
    updateRole,
    syncRolePermissions,
    deleteRole,
    setRoleFilters,
    setRolePage,
    setRoleSorting,
    resetRoleFilters,
    fetchPermissions,
  };
});
