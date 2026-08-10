<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ACCESS_PERMISSIONS, isSystemRole, roleName } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const route = useRoute();
const store = useAccessControlStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const id = route.params.id;

const assignedPermissions = computed(() =>
  (store.role?.permissions || []).map((permission) => (typeof permission === "string" ? permission : permission.name)).filter(Boolean)
);

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function deleteDisabledReason(role) {
  if (isSystemRole(role)) return "System roles are managed by the system.";
  if (Number(role?.users_count || 0) > 0) return "Reassign this role's users before deleting it.";
  return "";
}

function confirmDelete() {
  const reason = deleteDisabledReason(store.role);
  if (reason) {
    toast.add({ severity: "warn", summary: "Role cannot be deleted", detail: reason, life: 4500 });
    return;
  }
  confirm.require({
    header: "Delete Role",
    message: `Delete ${roleName(store.role)}?`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteRole(id);
        toast.add({ severity: "success", summary: "Role deleted", life: 3000 });
        await navigateTo("/roles");
      } catch (error) {
        toast.add({ severity: error.status === 409 ? "warn" : "error", summary: "Delete failed", detail: error.message, life: 6000 });
      }
    },
  });
}

onMounted(() => {
  if (can(ACCESS_PERMISSIONS.roles.view)) store.fetchRole(id);
});
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="m-0 text-2xl font-bold text-slate-900">{{ store.role ? roleName(store.role) : "Role Detail" }}</h1>
          <Tag v-if="store.role && isSystemRole(store.role)" value="System role" severity="info" />
        </div>
        <p class="m-0 font-mono text-sm text-slate-500">{{ store.role?.name }}</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/roles"><Button label="Back" icon="pi pi-arrow-left" severity="secondary" outlined /></NuxtLink>
        <NuxtLink v-if="store.role && can(ACCESS_PERMISSIONS.roles.update)" :to="`/roles/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" :disabled="isSystemRole(store.role)" />
        </NuxtLink>
        <Button
          v-if="store.role && can(ACCESS_PERMISSIONS.roles.delete)"
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          :disabled="Boolean(deleteDisabledReason(store.role))"
          :title="deleteDisabledReason(store.role)"
          @click="confirmDelete"
        />
      </div>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.roles.view)" severity="error" :closable="false">You do not have permission to view this role.</Message>
    <Message v-else-if="store.roleError" severity="error" :closable="false">
      {{ store.roleError }}
      <Button label="Retry" severity="secondary" text size="small" @click="store.fetchRole(id)" />
    </Message>

    <div v-else class="space-y-5">
      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <Skeleton v-if="store.roleLoading" height="8rem" />
        <dl v-else-if="store.role" class="grid gap-4 md:grid-cols-4">
          <div>
            <dt class="text-sm text-slate-500">Backend Name</dt>
            <dd class="m-0 font-mono text-sm text-slate-900">{{ store.role.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Permissions</dt>
            <dd class="m-0 font-semibold text-slate-900">{{ store.role.permissions_count ?? assignedPermissions.length }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Assigned Users</dt>
            <dd class="m-0 font-semibold text-slate-900">{{ store.role.users_count || 0 }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Created</dt>
            <dd class="m-0 font-semibold text-slate-900">{{ formatDate(store.role.created_at) }}</dd>
          </div>
        </dl>
        <Message v-if="store.role && isSystemRole(store.role)" severity="info" :closable="false" class="mt-4">
          This role is managed by the system. Rename, permission editing, and deletion are disabled.
        </Message>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="mb-4 text-base font-semibold text-slate-900">Assigned Permissions</h2>
        <div v-if="assignedPermissions.length" class="flex flex-wrap gap-2">
          <Tag v-for="permission in assignedPermissions" :key="permission" :value="permission" severity="secondary" />
        </div>
        <p v-else class="text-sm text-slate-500">No permissions assigned.</p>
      </section>
    </div>
  </div>
</template>
