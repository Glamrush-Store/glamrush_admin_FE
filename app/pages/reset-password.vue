<script setup>
import { ApiError } from "~/composables/apiClient";
import { AUTH } from "~/constants/endpoints";
import { Form } from "@primevue/forms";
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string, ref as yupRef } from "yup";

definePageMeta({ layout: "auth" });

const route = useRoute();
const resetToken = computed(() => route.query.token || "");

const resolver = yupResolver(
  object({
    password: string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters"),
    password_confirmation: string()
      .required("Please confirm your password")
      .oneOf([yupRef("password")], "Passwords must match"),
  })
);

const initialValues = {
  password: "",
  password_confirmation: "",
};

const loading = shallowRef(false);
const serverError = shallowRef("");

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    const api = useApiClient({ authToken: resetToken.value });
    const response = await api.post(AUTH.PASSWORD_RESET_CONFIRM, {
      password: values.password,
      password_confirmation: values.password_confirmation,
    });
    if (response.success) {
      navigateTo("/");
    }
  } catch (e) {
    if (e instanceof ApiError) {
      serverError.value = e.message;
    } else {
      serverError.value = e instanceof Error ? e.message : "Password reset failed";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <p class="auth-description">Enter your new password.</p>

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
        <label for="password">New Password</label>
        <Password
          id="password"
          name="password"
          placeholder="Enter new password"
          toggle-mask
          fluid
        />
        <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
          {{ $form.password.error?.message }}
        </Message>
      </div>

      <div class="form-field">
        <label for="password_confirmation">Confirm Password</label>
        <Password
          id="password_confirmation"
          name="password_confirmation"
          placeholder="Confirm new password"
          :feedback="false"
          toggle-mask
          fluid
        />
        <Message v-if="$form.password_confirmation?.invalid" severity="error" size="small" variant="simple">
          {{ $form.password_confirmation.error?.message }}
        </Message>
      </div>

      <Button type="submit" label="Reset Password" :loading="loading" fluid />

      <div class="auth-footer">
        <NuxtLink to="/">Back to login</NuxtLink>
      </div>
    </Form>
  </div>
</template>
