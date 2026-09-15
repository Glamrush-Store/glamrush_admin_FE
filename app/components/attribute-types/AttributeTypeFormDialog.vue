<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  attributeType: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  serverError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:visible", "submit"]);

const isEditing = computed(() => Boolean(props.attributeType?.id));
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const initialValues = computed(() => ({
  category: props.attributeType?.category ?? "",
  value: props.attributeType?.value ?? "",
  label: props.attributeType?.label ?? "",
  display_type: props.attributeType?.display_type ?? "",
}));

const formKey = computed(() => {
  const id = props.attributeType?.id ?? "new";
  return `${id}-${props.visible ? "open" : "closed"}`;
});

const resolver = yupResolver(
  object({
    category: string().nullable(),
    value: string()
      .required("Value is required")
      .matches(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, digits, and underscores; start with a letter."),
    label: string().required("Label is required"),
    display_type: string().required("Display type is required"),
  }),
);

function fieldError(field) {
  const error = props.errors?.[field];
  if (Array.isArray(error)) return error[0];
  return error || "";
}

function onSubmit({ valid, values }) {
  if (!valid) return;

  emit("submit", {
    category: values.category?.trim() || null,
    value: values.value?.trim() || "",
    label: values.label?.trim() || "",
    display_type: values.display_type?.trim() || "",
  });
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="isEditing ? 'Edit Attribute Type' : 'Create Attribute Type'"
    modal
    :style="{ width: '34rem', maxWidth: 'calc(100vw - 2rem)' }"
  >
    <Form
      :key="formKey"
      v-slot="$form"
      :initial-values="initialValues"
      :resolver="resolver"
      @submit="onSubmit"
    >
      <Message
        v-if="serverError"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        {{ serverError }}
      </Message>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="attribute-type-category" class="text-sm font-medium text-slate-700">Category</label>
          <InputText
            id="attribute-type-category"
            name="category"
            placeholder="Optional, e.g. product_identity"
            fluid
          />
          <small v-if="fieldError('category')" class="text-red-500">{{ fieldError("category") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="attribute-type-value" class="text-sm font-medium text-slate-700">Value *</label>
          <InputText
            id="attribute-type-value"
            name="value"
            placeholder="e.g. color"
            fluid
          />
          <Message
            v-if="$form.value?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.value.error?.message }}
          </Message>
          <small v-if="fieldError('value')" class="text-red-500">{{ fieldError("value") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="attribute-type-label" class="text-sm font-medium text-slate-700">Label *</label>
          <InputText
            id="attribute-type-label"
            name="label"
            placeholder="e.g. Color"
            fluid
          />
          <Message
            v-if="$form.label?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.label.error?.message }}
          </Message>
          <small v-if="fieldError('label')" class="text-red-500">{{ fieldError("label") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="attribute-type-display-type" class="text-sm font-medium text-slate-700">Display Type *</label>
          <InputText
            id="attribute-type-display-type"
            name="display_type"
            placeholder="e.g. select, color_swatch"
            fluid
          />
          <Message
            v-if="$form.display_type?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.display_type.error?.message }}
          </Message>
          <small v-if="fieldError('display_type')" class="text-red-500">{{ fieldError("display_type") }}</small>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          text
          :disabled="loading"
          @click="dialogVisible = false"
        />
        <Button
          type="submit"
          :label="isEditing ? 'Save changes' : 'Create'"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </Dialog>
</template>

