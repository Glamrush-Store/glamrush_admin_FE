<script setup>
import { useToast } from "primevue/usetoast";
import { ACCESS_PERMISSIONS, roleName, userRole } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const route = useRoute();
const store = useAccessControlStore();
const authStore = useAuthStore();
const toast = useToast();
const { can } = usePermissions();
const id = route.params.id;
const form = reactive({
  name: "",
  email: "",
  role_id: null,
  change_password: false,
  password: "",
  password_confirmation: "",
});
const serverError = shallowRef("");
const fieldErrors = ref({});

const isCurrentUser = computed(() => store.user?.id === authStore.user?.id);
const roleOptions = computed(() => store.roles.map((role) => ({ label: roleName(role), value: role.id })));

function hydrate() {
  if (!store.user) return;
  form.name = store.user.name || "";
  form.email = store.user.email || "";
  form.role_id = userRole(store.user)?.id || store.user.role_id || null;
}

function fieldError(field) {
  const error = fieldErrors.value[field];
  return Array.isArray(error) ? error[0] : error;
}

function validate() {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  if (!form.role_id) errors.role_id = "Select a role.";
  if (form.change_password) {
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) errors.password = "Password must be at least 8 characters and include letters and numbers.";
    if (form.password !== form.password_confirmation) errors.password_confirmation = "Passwords must match.";
  }
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function submit() {
  serverError.value = "";
  if (!validate()) return;
  const payload = {
    name: form.name,
    email: form.email,
    role_id: form.role_id,
  };
  if (isCurrentUser.value) delete payload.role_id;
  if (form.change_password) {
    payload.password = form.password;
    payload.password_confirmation = form.password_confirmation;
  }

  try {
    await store.updateUser(id, payload);
    toast.add({ severity: "success", summary: "User updated", life: 3000 });
    await navigateTo(`/users/${id}`);
  } catch (error) {
    serverError.value = error.message || "Unable to update user";
    fieldErrors.value = error.errors || {};
  }
}

onMounted(async () => {
  if (!can(ACCESS_PERMISSIONS.users.update)) return;
  await Promise.all([store.fetchUser(id), store.fetchRoleOptions()]);
  hydrate();
});

watch(() => store.user, hydrate);
</script>

<template>
  <div class="max-w-3xl">
    <Toast />
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Edit User</h1>
      <NuxtLink :to="`/users/${id}`"><Button label="Back" icon="pi pi-arrow-left" severity="secondary" outlined /></NuxtLink>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.users.update)" severity="error" :closable="false">You do not have permission to edit users.</Message>
    <Message v-else-if="store.userError" severity="error" :closable="false">{{ store.userError }}</Message>

    <div v-else class="rounded-lg border border-slate-200 bg-white p-5">
      <Message v-if="isCurrentUser" severity="info" :closable="false" class="mb-4">
        Your own role cannot be changed here.
      </Message>
      <Message v-if="serverError" severity="error" :closable="false" class="mb-4">{{ serverError }}</Message>
      <Skeleton v-if="store.userLoading" height="12rem" />
      <div v-else class="grid gap-4 md:grid-cols-2">
        <div class="form-field">
          <label>Name</label>
          <InputText v-model="form.name" class="w-full" />
          <Message v-if="fieldError('name')" severity="error" size="small" variant="simple">{{ fieldError("name") }}</Message>
        </div>
        <div class="form-field">
          <label>Email</label>
          <InputText v-model="form.email" type="email" class="w-full" />
          <Message v-if="fieldError('email')" severity="error" size="small" variant="simple">{{ fieldError("email") }}</Message>
        </div>
        <div class="form-field md:col-span-2">
          <label>Role</label>
          <Select v-model="form.role_id" :options="roleOptions" option-label="label" option-value="value" :disabled="isCurrentUser" class="w-full" />
          <Message v-if="fieldError('role_id')" severity="error" size="small" variant="simple">{{ fieldError("role_id") }}</Message>
        </div>
        <div class="md:col-span-2 flex items-center gap-2">
          <Checkbox v-model="form.change_password" input-id="changePassword" binary />
          <label for="changePassword" class="text-sm font-medium text-slate-700">Change password</label>
        </div>
        <template v-if="form.change_password">
          <div class="form-field">
            <label>New Password</label>
            <Password v-model="form.password" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
            <small class="text-slate-500">At least 8 characters with letters and numbers.</small>
            <Message v-if="fieldError('password')" severity="error" size="small" variant="simple">{{ fieldError("password") }}</Message>
          </div>
          <div class="form-field">
            <label>Confirm Password</label>
            <Password v-model="form.password_confirmation" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
            <Message v-if="fieldError('password_confirmation')" severity="error" size="small" variant="simple">{{ fieldError("password_confirmation") }}</Message>
          </div>
        </template>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <NuxtLink :to="`/users/${id}`"><Button label="Cancel" severity="secondary" text /></NuxtLink>
        <Button label="Save Changes" icon="pi pi-check" :loading="store.userSaving" @click="submit" />
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
