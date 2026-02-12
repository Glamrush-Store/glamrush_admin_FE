<script setup>
import { ApiError } from "~/composables/apiClient";
import { AUTH } from "~/constants/endpoints";
import { Form } from "@primevue/forms";
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";

definePageMeta({ layout: "auth" });

const route = useRoute();
const email = computed(() => route.query.email || "");

const resolver = yupResolver(
  object({
    code: string()
      .required("Verification code is required")
      .length(6, "Code must be exactly 6 digits"),
  })
);

const initialValues = { code: "" };

const loading = shallowRef(false);
const serverError = shallowRef("");

async function onSubmit({ valid, values }) {
  if (!valid) return;
  loading.value = true;
  serverError.value = "";
  try {
    const api = useApiClient();
    const response = await api.post(AUTH.PASSWORD_RESET_VERIFY, {
      email: email.value,
      code: values.code,
    });
    navigateTo({
      path: "/reset-password",
      query: { token: response.data.reset_token },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      serverError.value = e.message;
    } else {
      serverError.value = e instanceof Error ? e.message : "Verification failed";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <p class="auth-description">
      Enter the 6-digit code sent to <strong>{{ email }}</strong>.
    </p>

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
        <label for="code">Verification Code</label>
        <InputText
          id="code"
          name="code"
          placeholder="Enter 6-digit code"
          maxlength="6"
          fluid
        />
        <Message v-if="$form.code?.invalid" severity="error" size="small" variant="simple">
          {{ $form.code.error?.message }}
        </Message>
      </div>

      <Button type="submit" label="Verify Code" :loading="loading" fluid />

      <div class="auth-footer">
        <NuxtLink to="/forgot-password">Resend code</NuxtLink>
      </div>
    </Form>
  </div>
</template>
