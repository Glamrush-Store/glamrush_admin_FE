<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ACCESS_PERMISSIONS, PAGE_SIZE_OPTIONS, userRoleName } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const store = useAccessControlStore();
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const searchInput = shallowRef("");
let searchTimeout = null;

const currentUserId = computed(() => authStore.user?.id);
const roleOptions = computed(() => [
  { label: "All Roles", value: null },
  ...store.roles.map((role) => ({ label: roleName(role), value: role.id })),
]);

function roleName(role) {
  return String(role?.name || role || "-").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function onSearch(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => store.setUserFilters({ search: value }), 350);
}

function onSort(event) {
  store.setUserSorting(event.sortField || "created_at", event.sortOrder === 1 ? "asc" : "desc");
}

function confirmDelete(user) {
  if (user.id === currentUserId.value) {
    toast.add({ severity: "warn", summary: "Cannot delete yourself", detail: "Ask another super administrator to manage your account.", life: 4500 });
    return;
  }

  confirm.require({
    header: "Delete Admin User",
    message: `Delete ${user.name} (${user.email})? This revokes active API tokens, permanently removes the admin account, and does not delete audit records.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteUser(user.id);
        toast.add({ severity: "success", summary: "User deleted", life: 3000 });
        await store.fetchUsers();
      } catch (error) {
        toast.add({
          severity: error.status === 409 ? "warn" : "error",
          summary: "Delete failed",
          detail: error.message || "Unable to delete user",
          life: 6000,
        });
      }
    },
  });
}

function clearFilters() {
  searchInput.value = "";
  store.resetUserFilters();
}

onMounted(() => {
  if (can(ACCESS_PERMISSIONS.users.list)) store.fetchUsers();
  if (can(ACCESS_PERMISSIONS.roles.list)) store.fetchRoleOptions();
});

onBeforeUnmount(() => clearTimeout(searchTimeout));
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-slate-900">Users</h1>
      <NuxtLink v-if="can(ACCESS_PERMISSIONS.users.create)" to="/users/create">
        <Button label="Create User" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.users.list)" severity="error" :closable="false">
      You do not have permission to view users.
    </Message>

    <template v-else>
      <div class="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <div class="grid gap-3 md:grid-cols-4">
          <div class="flex flex-col gap-1 md:col-span-2">
            <label class="text-sm text-slate-600">Search</label>
            <InputText v-model="searchInput" placeholder="Name or email..." @input="onSearch(searchInput)" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-slate-600">Role</label>
            <Select
              :model-value="store.userFilters.role_id"
              :options="roleOptions"
              option-label="label"
              option-value="value"
              :loading="store.rolesLoading"
              @update:model-value="store.setUserFilters({ role_id: $event })"
            />
          </div>
          <div class="flex items-end gap-2">
            <Button label="Clear" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
            <Button icon="pi pi-refresh" severity="secondary" text :loading="store.usersLoading" @click="store.fetchUsers" />
          </div>
        </div>
      </div>

      <Message v-if="store.usersError" severity="error" :closable="false" class="mb-4">
        {{ store.usersError }}
        <Button label="Retry" severity="secondary" text size="small" @click="store.fetchUsers" />
      </Message>

      <DataTable
        :value="store.users"
        :loading="store.usersLoading"
        lazy
        striped-rows
        sort-mode="single"
        removable-sort
        class="mb-4"
        @sort="onSort"
      >
        <template #empty>
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-users mb-3 text-3xl" />
            <p class="m-0 font-medium text-slate-800">No users found</p>
          </div>
        </template>
        <Column field="name" header="Name" sortable>
          <template #body="{ data }">
            <div>
              <p class="m-0 font-semibold text-slate-900">{{ data.name }}</p>
              <p v-if="data.id === currentUserId" class="m-0 text-xs text-slate-500">Current user</p>
            </div>
          </template>
        </Column>
        <Column field="email" header="Email" sortable />
        <Column header="Role">
          <template #body="{ data }">{{ userRoleName(data) }}</template>
        </Column>
        <Column header="Email">
          <template #body="{ data }">
            <Tag :value="data.email_verified_at ? 'Verified' : 'Unverified'" :severity="data.email_verified_at ? 'success' : 'warning'" />
          </template>
        </Column>
        <Column field="created_at" header="Created" sortable>
          <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
        </Column>
        <Column header="Actions" class="w-36">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <NuxtLink v-if="can(ACCESS_PERMISSIONS.users.view)" :to="`/users/${data.id}`">
                <Button icon="pi pi-eye" severity="info" text rounded aria-label="View user" />
              </NuxtLink>
              <NuxtLink v-if="can(ACCESS_PERMISSIONS.users.update)" :to="`/users/${data.id}/edit`">
                <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit user" />
              </NuxtLink>
              <Button
                v-if="can(ACCESS_PERMISSIONS.users.delete)"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                :disabled="data.id === currentUserId"
                aria-label="Delete user"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <Paginator
        :rows="store.userPagination.per_page"
        :total-records="store.userPagination.total"
        :first="(store.userPagination.current_page - 1) * store.userPagination.per_page"
        :rows-per-page-options="PAGE_SIZE_OPTIONS"
        @page="store.setUserPage($event.page + 1, $event.rows)"
      />
    </template>
  </div>
</template>
