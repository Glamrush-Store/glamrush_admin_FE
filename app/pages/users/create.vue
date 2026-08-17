<script setup>
import { useToast } from "primevue/usetoast";
import { ACCESS_PERMISSIONS, normalizeRoleName, roleName } from "~/constants/accessControl";
import { useAccessControlStore } from "~/stores/accessControl";

const store = useAccessControlStore();
const toast = useToast();
const { can } = usePermissions();
const form = reactive({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role_id: null,
});
const serverError = shallowRef("");
const fieldErrors = ref({});
const showPassword = shallowRef(false);

const roleOptions = computed(() => store.roles.map((role) => ({ label: roleName(role), value: role.id })));

function fieldError(field) {
  const error = fieldErrors.value[field];
  return Array.isArray(error) ? error[0] : error;
}

function validate() {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  if (!form.role_id) errors.role_id = "Select a role.";
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
    errors.password = "Password must be at least 8 characters and include letters and numbers.";
  }
  if (form.password !== form.password_confirmation) errors.password_confirmation = "Passwords must match.";
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function submit() {
  serverError.value = "";
  if (!validate()) return;
  try {
    const response = await store.createUser({ ...form });
    toast.add({ severity: "success", summary: "User created", life: 3000 });
    await navigateTo(response.data?.id ? `/users/${response.data.id}` : "/users");
  } catch (error) {
    serverError.value = error.message || "Unable to create user";
    fieldErrors.value = error.errors || {};
  }
}

onMounted(() => {
  if (can(ACCESS_PERMISSIONS.roles.list)) store.fetchRoleOptions();
});
</script>

<template>
  <div class="max-w-3xl">
    <Toast />
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Create User</h1>
      <NuxtLink to="/users"><Button label="Back" icon="pi pi-arrow-left" severity="secondary" outlined /></NuxtLink>
    </div>

    <Message v-if="!can(ACCESS_PERMISSIONS.users.create)" severity="error" :closable="false">You do not have permission to create users.</Message>

    <div v-else class="rounded-lg border border-slate-200 bg-white p-5">
      <Message v-if="serverError" severity="error" :closable="false" class="mb-4">{{ serverError }}</Message>
      <div class="grid gap-4 md:grid-cols-2">
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
        <div class="form-field">
          <label>Role</label>
          <Select v-model="form.role_id" :options="roleOptions" option-label="label" option-value="value" :loading="store.rolesLoading" class="w-full" />
          <small class="text-slate-500">Role names are normalized like {{ normalizeRoleName("Sales Manager") }}.</small>
          <Message v-if="fieldError('role_id')" severity="error" size="small" variant="simple">{{ fieldError("role_id") }}</Message>
        </div>
        <div class="form-field">
          <label>Password</label>
          <Password v-model="form.password" :feedback="false" toggle-mask :type="showPassword ? 'text' : 'password'" class="w-full" input-class="w-full" />
          <small class="text-slate-500">At least 8 characters with letters and numbers.</small>
          <Message v-if="fieldError('password')" severity="error" size="small" variant="simple">{{ fieldError("password") }}</Message>
        </div>
        <div class="form-field md:col-span-2">
          <label>Confirm Password</label>
          <Password v-model="form.password_confirmation" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
          <Message v-if="fieldError('password_confirmation')" severity="error" size="small" variant="simple">{{ fieldError("password_confirmation") }}</Message>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <NuxtLink to="/users"><Button label="Cancel" severity="secondary" text /></NuxtLink>
        <Button label="Create User" icon="pi pi-check" :loading="store.userSaving" @click="submit" />
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
