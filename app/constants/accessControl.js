export const ACCESS_PERMISSIONS = {
  users: {
    list: "ViewAny_User",
    view: "View_User",
    create: "Create_User",
    update: "Update_User",
    delete: "Delete_User",
  },
  roles: {
    list: "ViewAny_Role",
    view: "View_Role",
    create: "Create_Role",
    update: "Update_Role",
    delete: "Delete_Role",
  },
};

export const USER_SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
  { label: "Created Date", value: "created_at" },
  { label: "Updated Date", value: "updated_at" },
];

export const ROLE_SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Created Date", value: "created_at" },
  { label: "Updated Date", value: "updated_at" },
];

export const SORT_DIRECTIONS = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const PERMISSION_ACTION_ORDER = ["ViewAny", "View", "Create", "Update", "Delete", "Restore"];

export function humanizeSnake(value) {
  if (!value) return "-";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeRoleName(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

export function isSystemRole(role) {
  return Boolean(role?.is_system || role?.name === "super_admin");
}

export function roleName(role) {
  return humanizeSnake(role?.name || role);
}

export function userRole(user) {
  return user?.role || user?.assigned_role || user?.roles?.[0] || null;
}

export function userRoleName(user) {
  const role = userRole(user);
  return roleName(role?.name || role);
}
