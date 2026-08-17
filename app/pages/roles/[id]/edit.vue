<script setup>
import { useToast } from "primevue/usetoast";
import { ACCESS_PERMISSIONS, isSystemRole, normalizeRoleName, roleName } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const route = useRoute();
const store = useAccessControlStore();
const toast = useToast();
const { can } = usePermissions();
const id = route.params.id;
const form = reactive({ name: "", permissions: [] });
const serverError = shallowRef("");
const fieldErrors = ref({});
const dirty = shallowRef(false);

const normalizedName = computed(() => normalizeRoleName(form.name));
const isProtected = computed(() => isSystemRole(store.role));

function hydrate() {
  if (!store.role) return;
  form.name = store.role.name || "";
  form.permissions = (store.role.permissions || [])
    .map((permission) => (typeof permission === "string" ? permission : permission.name))
    .filter(Boolean);
}

function fieldError(field) {
  const error = fieldErrors.value[field];
  return Array.isArray(error) ? error[0] : error;
}

function validate() {
  const errors = {};
  if (!normalizedName.value) errors.name = "Role name is required.";
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function submit() {
  serverError.value = "";
  if (!validate()) return;
  try {
    if (!isProtected.value) {
      await store.updateRole(id, { name: normalizedName.value });
      await store.syncRolePermissions(id, form.permissions);
    }
    dirty.value = false;
    toast.add({ severity: "success", summary: "Role updated", life: 3000 });
    await navigateTo(`/roles/${id}`);
  } catch (error) {
    serverError.value = error.message || "Unable to update role";
    fieldErrors.value = error.errors || {};
  }
}

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm("Discard unsaved role changes?")) return false;
});

onMounted(async () => {
  if (!can(ACCESS_PERMISSIONS.roles.update)) return;
  await Promise.all([store.fetchRole(id), store.fetchPermissions()]);
  hydrate();
});

watch(() => store.role, hydrate);
</script>

<template>
  <div>
    <Toast />
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Edit Role</h1>
      <NuxtLink :to="`/roles/${id}`"><Button label="Back" icon="pi pi-arrow-left" severity="secondary" outlined /></NuxtLink>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.roles.update)" severity="error" :closable="false">You do not have permission to edit roles.</Message>
    <Message v-else-if="store.roleError" severity="error" :closable="false">{{ store.roleError }}</Message>

    <div v-else class="space-y-5">
      <Message v-if="serverError" severity="error" :closable="false">{{ serverError }}</Message>
      <Message v-if="isProtected" severity="info" :closable="false">
        This system role is managed by the system. Rename, permission editing, and deletion are disabled.
      </Message>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <Skeleton v-if="store.roleLoading" height="6rem" />
        <div v-else class="form-field max-w-xl">
          <label>Role Name</label>
          <InputText v-model="form.name" class="w-full" :disabled="isProtected" @input="dirty = true" />
          <small class="text-slate-500">Saved as {{ normalizedName || "role_name" }} and displayed as {{ roleName(normalizedName) }}.</small>
          <Message v-if="fieldError('name')" severity="error" size="small" variant="simple">{{ fieldError("name") }}</Message>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="m-0 text-base font-semibold text-slate-900">Permissions</h2>
          <Tag :value="`${form.permissions.length} selected`" severity="info" />
        </div>
        <Message v-if="store.permissionsError" severity="error" :closable="false" class="mb-4">
          {{ store.permissionsError }}
          <Button label="Retry" severity="secondary" text size="small" @click="store.fetchPermissions" />
        </Message>
        <Skeleton v-if="store.permissionsLoading" height="14rem" />
        <AccessControlPermissionMatrix
          v-else
          v-model:selected="form.permissions"
          :permissions="store.permissions"
          :disabled="isProtected"
          @update:selected="dirty = true"
        />
      </section>

      <div class="flex justify-end gap-2">
        <NuxtLink :to="`/roles/${id}`"><Button label="Cancel" severity="secondary" text /></NuxtLink>
        <Button label="Save Changes" icon="pi pi-check" :loading="store.roleSaving" :disabled="isProtected" @click="submit" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(51 65 85);
}
</style>
