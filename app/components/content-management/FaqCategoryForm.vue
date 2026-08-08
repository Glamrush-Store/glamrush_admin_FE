<script setup>
import { slugifyContentValue } from "~/utils/contentPreview";

const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serverError: {
    type: String,
    default: "",
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["submit", "cancel"]);

const name = ref("");
const slug = ref("");
const slugManuallyEdited = ref(false);
const description = ref("");
const displayOrder = ref(0);
const isActive = ref(true);
const localError = ref("");

watch(
  () => props.initialValues,
  (initial) => {
    name.value = initial.name || "";
    slug.value = initial.slug || "";
    slugManuallyEdited.value = !!initial.slug;
    description.value = initial.description || "";
    displayOrder.value = initial.display_order ?? 0;
    isActive.value = initial.is_active ?? true;
  },
  { immediate: true },
);

watch(name, (value) => {
  if (!slugManuallyEdited.value) slug.value = slugifyContentValue(value);
});

function fieldError(name) {
  return props.fieldErrors?.[name]?.[0] || "";
}

function onSlugInput(value) {
  slugManuallyEdited.value = true;
  slug.value = slugifyContentValue(value);
}

function onSubmit() {
  localError.value = "";
  if (!name.value || !slug.value) {
    localError.value = "Name and slug are required.";
    return;
  }
  emit("submit", {
    name: name.value,
    slug: slug.value,
    description: description.value || null,
    display_order: displayOrder.value || 0,
    is_active: isActive.value,
  });
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4">
    <Message v-if="serverError || localError" severity="error" :closable="false">
      {{ serverError || localError }}
    </Message>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-700">Name *</label>
        <InputText v-model="name" fluid />
        <Message v-if="fieldError('name')" severity="error" size="small" variant="simple">{{ fieldError("name") }}</Message>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-700">Slug *</label>
        <InputText :model-value="slug" fluid @update:model-value="onSlugInput" />
        <Message v-if="fieldError('slug')" severity="error" size="small" variant="simple">{{ fieldError("slug") }}</Message>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-700">Display Order</label>
        <InputNumber v-model="displayOrder" :min="0" :use-grouping="false" fluid />
      </div>
      <div class="flex items-center justify-between rounded-md border border-slate-200 p-3">
        <span class="text-sm font-medium text-slate-700">Active</span>
        <ToggleSwitch v-model="isActive" />
      </div>
      <div class="md:col-span-2 flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-700">Description</label>
        <Textarea v-model="description" rows="3" fluid />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" text @click="emit('cancel')" />
      <Button type="button" label="Save Category" icon="pi pi-check" :loading="loading" @click="onSubmit" />
    </div>
  </div>
</template>
