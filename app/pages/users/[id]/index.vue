<script setup>
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { ACCESS_PERMISSIONS, userRoleName } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const route = useRoute();
const store = useAccessControlStore();
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();
const { can } = usePermissions();
const id = route.params.id;

const isCurrentUser = computed(() => store.user?.id === authStore.user?.id);

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function confirmDelete() {
  if (isCurrentUser.value) {
    toast.add({ severity: "warn", summary: "Cannot delete yourself", life: 4000 });
    return;
  }
  confirm.require({
    header: "Delete Admin User",
    message: `Delete ${store.user.name} (${store.user.email})? This revokes active API tokens, permanently removes the admin account, and does not delete audit records.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteUser(id);
        toast.add({ severity: "success", summary: "User deleted", life: 3000 });
        await navigateTo("/users");
      } catch (error) {
        toast.add({ severity: error.status === 409 ? "warn" : "error", summary: "Delete failed", detail: error.message, life: 6000 });
      }
    },
  });
}

onMounted(() => {
  if (can(ACCESS_PERMISSIONS.users.view)) store.fetchUser(id);
});
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{{ store.user?.name || "User Detail" }}</h1>
        <p class="m-0 text-sm text-slate-500">{{ store.user?.email }}</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/users"><Button label="Back" icon="pi pi-arrow-left" severity="secondary" outlined /></NuxtLink>
        <NuxtLink v-if="store.user && can(ACCESS_PERMISSIONS.users.update)" :to="`/users/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
        <Button
          v-if="store.user && can(ACCESS_PERMISSIONS.users.delete)"
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          :disabled="isCurrentUser"
          @click="confirmDelete"
        />
      </div>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.users.view)" severity="error" :closable="false">You do not have permission to view this user.</Message>
    <Message v-else-if="store.userError" severity="error" :closable="false">
      {{ store.userError }}
      <Button label="Retry" severity="secondary" text size="small" @click="store.fetchUser(id)" />
    </Message>

    <div v-else class="rounded-lg border border-slate-200 bg-white p-5">
      <Skeleton v-if="store.userLoading" height="10rem" />
      <dl v-else-if="store.user" class="grid gap-4 md:grid-cols-2">
        <div>
          <dt class="text-sm text-slate-500">Name</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ store.user.name }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Email</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ store.user.email }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Assigned Role</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ userRoleName(store.user) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Email Verification</dt>
          <dd class="m-0">
            <Tag :value="store.user.email_verified_at ? 'Verified' : 'Unverified'" :severity="store.user.email_verified_at ? 'success' : 'warning'" />
          </dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Created</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ formatDate(store.user.created_at) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Updated</dt>
          <dd class="m-0 font-semibold text-slate-900">{{ formatDate(store.user.updated_at) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
