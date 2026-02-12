<script setup>
import { useAuthStore } from "~/stores/auth";
import { Form } from "@primevue/forms";
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";

definePageMeta({ layout: "auth" });

const authStore = useAuthStore();

const resolver = yupResolver(
  object({
    email: string().required("Email is required").email("Enter a valid email"),
    password: string().required("Password is required"),
  })
);

const initialValues = {
  email: "",
  password: "",
};

const loading = shallowRef(false);
const serverError = shallowRef("");

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    await authStore.login({
      email: values.email,
      password: values.password,
      device_id: "glamrush-admin-web",
      device_name: "Glamrush Admin Panel",
    });
    navigateTo("/dashboard");
  } catch (e) {
    serverError.value = e instanceof Error ? e.message : "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <Form
      v-slot="$form"
      :initialValues="initialValues"
      :resolver="resolver"
      class="auth-form"
      @submit="onSubmit"
    >
      <Message v-if="serverError" severity="error" :closable="false">
        {{ serverError }}
      </Message>

      <div class="form-field">
        <label for="email">Email</label>
        <InputText
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          fluid
        />
        <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
          {{ $form.email.error?.message }}
        </Message>
      </div>

      <div class="form-field">
        <label for="password">Password</label>
        <Password
          id="password"
          name="password"
          placeholder="Enter your password"
          :feedback="false"
          toggle-mask
          fluid
        />
        <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
          {{ $form.password.error?.message }}
        </Message>
      </div>

      <Button type="submit" label="Sign In" :loading="loading" fluid />

      <div class="auth-footer">
        <NuxtLink to="/forgot-password">Forgot password?</NuxtLink>
      </div>
    </Form>
  </div>
</template>
