<script setup>
import { ApiError } from "~/composables/apiClient";
import { AUTH } from "~/constants/endpoints";
import { Form } from "@primevue/forms";
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";

definePageMeta({ layout: "auth" });

const resolver = yupResolver(
  object({
    email: string().required("Email is required").email("Enter a valid email"),
  })
);

const initialValues = { email: "" };

const loading = shallowRef(false);
const serverError = shallowRef("");

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    const api = useApiClient();
    await api.post(AUTH.PASSWORD_RESET_REQUEST, {
      email: values.email,
    });
    navigateTo({ path: "/verify-code", query: { email: values.email } });
  } catch (e) {
    if (e instanceof ApiError) {
      serverError.value = e.message;
    } else {
      serverError.value = e instanceof Error ? e.message : "Request failed";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <p class="auth-description">Enter your email to receive a reset code.</p>

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

      <Button type="submit" label="Send Reset Code" :loading="loading" fluid />

      <div class="auth-footer">
        <NuxtLink to="/">Back to login</NuxtLink>
      </div>
    </Form>
  </div>
</template>
