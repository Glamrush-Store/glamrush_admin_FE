<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";

const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({}),
  },
  storefronts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: "Save Campaign",
  },
  storefrontDisabled: {
    type: Boolean,
    default: false,
  },
  serverError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["submit"]);

const resolver = yupResolver(
  object({
    internal_name: string().required("Internal name is required").max(255, "Max 255 characters"),
    eyebrow: string().nullable().max(255, "Max 255 characters"),
    title: string().required("Title is required").max(255, "Max 255 characters"),
    description: string().nullable().max(5000, "Max 5000 characters"),
    cta_label: string().nullable().max(100, "Max 100 characters"),
    cta_url: string()
      .nullable()
      .matches(/^(\/|https?:\/\/).*/i, {
        message: "CTA URL must start with /, http://, or https://",
        excludeEmptyString: true,
      }),
  }),
);

const selectedStorefront = ref("");
const priority = ref(0);
const isActive = ref(true);
const startsAt = ref(null);
const endsAt = ref(null);
const desktopImage = ref(null);
const mobileImage = ref(null);

const formInitialValues = computed(() => ({
  internal_name: props.initialValues.internal_name || "",
  eyebrow: props.initialValues.eyebrow || "",
  title: props.initialValues.title || "",
  description: props.initialValues.description || "",
  cta_label: props.initialValues.cta_label || "",
  cta_url: props.initialValues.cta_url || "",
}));

watch(
  () => props.initialValues,
  (value) => {
    selectedStorefront.value = value.storefront_slug || "";
    priority.value = value.priority ?? 0;
    isActive.value = value.is_active ?? true;
    startsAt.value = value.starts_at ? new Date(value.starts_at) : null;
    endsAt.value = value.ends_at ? new Date(value.ends_at) : null;
  },
  { immediate: true },
);

function makePreview(file) {
  return { file, previewUrl: URL.createObjectURL(file) };
}

function onDesktopImageSelect(event) {
  const file = event.files?.[0];
  if (!file) return;
  removeDesktopImage();
  desktopImage.value = makePreview(file);
}

function onMobileImageSelect(event) {
  const file = event.files?.[0];
  if (!file) return;
  removeMobileImage();
  mobileImage.value = makePreview(file);
}

function removeDesktopImage() {
  if (desktopImage.value) URL.revokeObjectURL(desktopImage.value.previewUrl);
  desktopImage.value = null;
}

function removeMobileImage() {
  if (mobileImage.value) URL.revokeObjectURL(mobileImage.value.previewUrl);
  mobileImage.value = null;
}

function formatDateForApi(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function appendIfPresent(formData, key, value) {
  if (value !== null && value !== undefined && value !== "") {
    formData.append(key, value);
  }
}

function buildFormData(values) {
  const formData = new FormData();
  formData.append("internal_name", values.internal_name);
  formData.append("title", values.title);
  appendIfPresent(formData, "eyebrow", values.eyebrow);
  appendIfPresent(formData, "description", values.description);
  appendIfPresent(formData, "cta_label", values.cta_label);
  appendIfPresent(formData, "cta_url", values.cta_url);
  formData.append("priority", priority.value ?? 0);
  formData.append("is_active", isActive.value ? "1" : "0");
  appendIfPresent(formData, "starts_at", formatDateForApi(startsAt.value));
  appendIfPresent(formData, "ends_at", formatDateForApi(endsAt.value));

  if (desktopImage.value) formData.append("desktop_image", desktopImage.value.file);
  if (mobileImage.value) formData.append("mobile_image", mobileImage.value.file);

  return formData;
}

function onSubmit({ valid, values }) {
  if (!valid || !selectedStorefront.value) return;
  emit("submit", {
    storefront: selectedStorefront.value,
    formData: buildFormData(values),
  });
}

onBeforeUnmount(() => {
  removeDesktopImage();
  removeMobileImage();
});
</script>

<template>
  <Form
    v-slot="$form"
    :key="JSON.stringify(formInitialValues)"
    :initial-values="formInitialValues"
    :resolver="resolver"
    @submit="onSubmit"
  >
    <Message v-if="serverError" severity="error" :closable="false" class="mb-4">
      {{ serverError }}
    </Message>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Campaign Setup</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Storefront *</label>
          <Select
            v-model="selectedStorefront"
            :options="storefronts"
            option-label="name"
            option-value="slug"
            placeholder="Select storefront"
            :disabled="storefrontDisabled"
            fluid
          />
          <Message
            v-if="!selectedStorefront"
            severity="error"
            size="small"
            variant="simple"
          >
            Storefront is required
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="internal_name" class="text-sm font-medium text-slate-700">
            Internal Name *
          </label>
          <InputText id="internal_name" name="internal_name" placeholder="Homepage sale hero" fluid />
          <Message v-if="$form.internal_name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.internal_name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="eyebrow" class="text-sm font-medium text-slate-700">Eyebrow</label>
          <InputText id="eyebrow" name="eyebrow" placeholder="Limited offer" fluid />
          <Message v-if="$form.eyebrow?.invalid" severity="error" size="small" variant="simple">
            {{ $form.eyebrow.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="title" class="text-sm font-medium text-slate-700">Title *</label>
          <InputText id="title" name="title" placeholder="Glow essentials are here" fluid />
          <Message v-if="$form.title?.invalid" severity="error" size="small" variant="simple">
            {{ $form.title.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Priority</label>
          <InputNumber v-model="priority" :min="-100000" :max="100000" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Active</label>
          <ToggleSwitch v-model="isActive" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Campaign Content</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2 flex flex-col gap-1">
          <label for="description" class="text-sm font-medium text-slate-700">Description</label>
          <Textarea id="description" name="description" rows="4" placeholder="Short storefront campaign copy" fluid />
          <Message v-if="$form.description?.invalid" severity="error" size="small" variant="simple">
            {{ $form.description.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="cta_label" class="text-sm font-medium text-slate-700">CTA Label</label>
          <InputText id="cta_label" name="cta_label" placeholder="Shop now" fluid />
          <Message v-if="$form.cta_label?.invalid" severity="error" size="small" variant="simple">
            {{ $form.cta_label.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="cta_url" class="text-sm font-medium text-slate-700">CTA URL</label>
          <InputText id="cta_url" name="cta_url" placeholder="/collections/new-arrivals" fluid />
          <Message v-if="$form.cta_url?.invalid" severity="error" size="small" variant="simple">
            {{ $form.cta_url.error?.message }}
          </Message>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Schedule</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Starts At</label>
          <DatePicker v-model="startsAt" show-time hour-format="24" date-format="yy-mm-dd" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Ends At</label>
          <DatePicker v-model="endsAt" show-time hour-format="24" date-format="yy-mm-dd" fluid />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Images</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 class="text-sm font-medium text-slate-700 mb-2">Desktop Image</h3>
          <FileUpload accept="image/jpeg,image/jpg,image/png,image/webp" :auto="false" :show-upload-button="false" @select="onDesktopImageSelect" @clear="removeDesktopImage">
            <template #header="{ chooseCallback, clearCallback }">
              <div class="flex items-center gap-2">
                <Button type="button" icon="pi pi-image" label="Choose" outlined severity="secondary" @click="chooseCallback" />
                <Button type="button" icon="pi pi-times" label="Clear" outlined severity="danger" :disabled="!desktopImage" @click="clearCallback" />
              </div>
            </template>
            <template #content>
              <div v-if="desktopImage" class="mt-3">
                <img :src="desktopImage.previewUrl" :alt="desktopImage.file.name" class="w-full max-h-48 object-cover rounded-lg border border-slate-200" />
                <p class="text-xs text-slate-500 mt-2 truncate">{{ desktopImage.file.name }}</p>
              </div>
              <div v-else class="flex items-center justify-center h-36 bg-slate-50 rounded-lg text-slate-400">
                <i class="pi pi-desktop text-3xl" />
              </div>
            </template>
          </FileUpload>
        </div>

        <div>
          <h3 class="text-sm font-medium text-slate-700 mb-2">Mobile Image</h3>
          <FileUpload accept="image/jpeg,image/jpg,image/png,image/webp" :auto="false" :show-upload-button="false" @select="onMobileImageSelect" @clear="removeMobileImage">
            <template #header="{ chooseCallback, clearCallback }">
              <div class="flex items-center gap-2">
                <Button type="button" icon="pi pi-mobile" label="Choose" outlined severity="secondary" @click="chooseCallback" />
                <Button type="button" icon="pi pi-times" label="Clear" outlined severity="danger" :disabled="!mobileImage" @click="clearCallback" />
              </div>
            </template>
            <template #content>
              <div v-if="mobileImage" class="mt-3">
                <img :src="mobileImage.previewUrl" :alt="mobileImage.file.name" class="w-full max-h-48 object-cover rounded-lg border border-slate-200" />
                <p class="text-xs text-slate-500 mt-2 truncate">{{ mobileImage.file.name }}</p>
              </div>
              <div v-else class="flex items-center justify-center h-36 bg-slate-50 rounded-lg text-slate-400">
                <i class="pi pi-mobile text-3xl" />
              </div>
            </template>
          </FileUpload>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <Button type="submit" :label="submitLabel" icon="pi pi-check" :loading="loading" />
    </div>
  </Form>
</template>
