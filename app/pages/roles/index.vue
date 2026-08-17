<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ACCESS_PERMISSIONS, PAGE_SIZE_OPTIONS, isSystemRole, roleName } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const store = useAccessControlStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const searchInput = shallowRef("");
let searchTimeout = null;

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function onSearch(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => store.setRoleFilters({ search: value }), 350);
}

function onSort(event) {
  store.setRoleSorting(event.sortField || "created_at", event.sortOrder === 1 ? "asc" : "desc");
}

function deleteDisabledReason(role) {
  if (isSystemRole(role)) return "System roles are managed by the system.";
  if (Number(role.users_count || 0) > 0) return "Reassign this role's users before deleting it.";
  return "";
}

function confirmDelete(role) {
  const reason = deleteDisabledReason(role);
  if (reason) {
    toast.add({ severity: "warn", summary: "Role cannot be deleted", detail: reason, life: 4500 });
    return;
  }
  confirm.require({
    header: "Delete Role",
    message: `Delete ${roleName(role)}? This cannot be undone.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteRole(role.id);
        toast.add({ severity: "success", summary: "Role deleted", life: 3000 });
        await store.fetchRoles();
      } catch (error) {
        toast.add({ severity: error.status === 409 ? "warn" : "error", summary: "Delete failed", detail: error.message, life: 6000 });
      }
    },
  });
}

function clearFilters() {
  searchInput.value = "";
  store.resetRoleFilters();
}

onMounted(() => {
  if (can(ACCESS_PERMISSIONS.roles.list)) store.fetchRoles();
});
onBeforeUnmount(() => clearTimeout(searchTimeout));
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-slate-900">Roles and Permissions</h1>
      <NuxtLink v-if="can(ACCESS_PERMISSIONS.roles.create)" to="/roles/create">
        <Button label="Create Role" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.roles.list)" severity="error" :closable="false">You do not have permission to view roles.</Message>

    <template v-else>
      <div class="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex min-w-72 flex-col gap-1">
            <label class="text-sm text-slate-600">Search</label>
            <InputText v-model="searchInput" placeholder="Role name..." @input="onSearch(searchInput)" />
          </div>
          <Button label="Clear" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
          <Button icon="pi pi-refresh" severity="secondary" text :loading="store.rolesLoading" @click="store.fetchRoles" />
        </div>
      </div>

      <Message v-if="store.rolesError" severity="error" :closable="false" class="mb-4">
        {{ store.rolesError }}
        <Button label="Retry" severity="secondary" text size="small" @click="store.fetchRoles" />
      </Message>

      <DataTable :value="store.roles" :loading="store.rolesLoading" lazy striped-rows sort-mode="single" removable-sort class="mb-4" @sort="onSort">
        <template #empty>
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-shield mb-3 text-3xl" />
            <p class="m-0 font-medium text-slate-800">No roles found</p>
          </div>
        </template>
        <Column field="name" header="Role" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-900">{{ roleName(data) }}</span>
              <Tag v-if="isSystemRole(data)" value="System role" severity="info" />
            </div>
            <p class="m-0 font-mono text-xs text-slate-500">{{ data.name }}</p>
          </template>
        </Column>
        <Column field="permissions_count" header="Permissions" />
        <Column field="users_count" header="Users" />
        <Column field="created_at" header="Created" sortable>
          <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
        </Column>
        <Column header="Actions" class="w-48">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <NuxtLink v-if="can(ACCESS_PERMISSIONS.roles.view)" :to="`/roles/${data.id}`">
                <Button icon="pi pi-eye" severity="info" text rounded aria-label="View role" />
              </NuxtLink>
              <NuxtLink v-if="can(ACCESS_PERMISSIONS.roles.update)" :to="`/roles/${data.id}/edit`">
                <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit role" />
              </NuxtLink>
              <Button
                v-if="can(ACCESS_PERMISSIONS.roles.delete)"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                :disabled="Boolean(deleteDisabledReason(data))"
                :title="deleteDisabledReason(data)"
                aria-label="Delete role"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <Paginator
        :rows="store.rolePagination.per_page"
        :total-records="store.rolePagination.total"
        :first="(store.rolePagination.current_page - 1) * store.rolePagination.per_page"
        :rows-per-page-options="PAGE_SIZE_OPTIONS"
        @page="store.setRolePage($event.page + 1, $event.rows)"
      />
    </template>
  </div>
</template>
