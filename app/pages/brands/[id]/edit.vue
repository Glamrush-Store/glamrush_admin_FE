<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useBrandStore } from "~/stores/brand";
import { MEDIA } from "~/constants/endpoints";

const route = useRoute();
const id = route.params.id;
const brandStore = useBrandStore();

const resolver = yupResolver(
  object({
    name: string()
      .required("Name is required")
      .min(2, "Min 2 characters")
      .max(255, "Max 255 characters"),
  }),
);

const initialValues = ref({
  name: "",
});

// --- Optional fields ---
const code = ref("");
const description = ref("");
const metaTitle = ref("");
const metaKeywords = ref("");
const metaDescription = ref("");
const sortOrder = ref(0);
const isActive = ref(true);

// --- Image handling ---
const image = ref(null);
const existingImage = ref(null);

function onImageSelect(event) {
  const file = event.files[0];
  if (!file) return;
  if (image.value) URL.revokeObjectURL(image.value.previewUrl);
  existingImage.value = null;
  image.value = { file, previewUrl: URL.createObjectURL(file) };
}

function removeNewImage() {
  if (image.value) {
    URL.revokeObjectURL(image.value.previewUrl);
    image.value = null;
  }
}

async function deleteExistingImage() {
  if (!existingImage.value) return;
  try {
    const api = useApiClient();
    await api.del(MEDIA.DELETE(existingImage.value.id));
    existingImage.value = null;
  } catch (e) {
    serverError.value = "Failed to delete image";
  }
}

function onImageClear() {
  removeNewImage();
}

onBeforeUnmount(() => {
  if (image.value) URL.revokeObjectURL(image.value.previewUrl);
});

// --- UI state ---
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});

// --- Load brand data ---
onMounted(async () => {
  try {
    await brandStore.fetchBrand(id);
    const b = brandStore.brand;
    if (!b) {
      navigateTo("/brands");
      return;
    }
    initialValues.value = {
      name: b.name || "",
    };
    code.value = b.code || "";
    description.value = b.description || "";
    sortOrder.value = b.sort_order ?? 0;
    isActive.value = b.is_active ?? true;
    metaTitle.value = b.meta_title || "";
    metaKeywords.value = b.meta_keywords || "";
    metaDescription.value = b.meta_description || "";
    if (b.image) existingImage.value = b.image;
  } finally {
    pageLoading.value = false;
  }
});

// --- Form submission ---
async function onSubmit({ valid, values }) {
  if (!valid) return;

  validationErrors.value = {};
  loading.value = true;
  serverError.value = "";

  try {
    const formData = new FormData();
    formData.append("name", values.name);
    if (code.value) formData.append("code", code.value);
    if (description.value) formData.append("description", description.value);
    formData.append("sort_order", sortOrder.value ?? 0);
    formData.append("is_active", isActive.value ? "1" : "0");
    if (metaTitle.value) formData.append("meta_title", metaTitle.value);
    if (metaKeywords.value)
      formData.append("meta_keywords", metaKeywords.value);
    if (metaDescription.value)
      formData.append("meta_description", metaDescription.value);
    if (image.value) formData.append("photo", image.value.file);

    await brandStore.updateBrand(id, formData);
    navigateTo(`/brands/${id}`);
  } catch (e) {
    if (e instanceof ApiError) {
      serverError.value = e.message;
      if (e.errors) validationErrors.value = e.errors;
    } else {
      serverError.value = "An unexpected error occurred";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="`/brands/${id}`">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Brand</h1>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Form
      v-else
      v-slot="$form"
      :initial-values="initialValues"
      :resolver="resolver"
      @submit="onSubmit"
    >
      <!-- Server error -->
      <Message
        v-if="serverError"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        {{ serverError }}
      </Message>

      <!-- Card 1: General Information -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">
          General Information
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div class="flex flex-col gap-1">
            <label for="name" class="text-sm font-medium text-slate-700"
              >Name *</label
            >
            <InputText id="name" name="name" placeholder="Brand name" fluid />
            <Message
              v-if="$form.name?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <!-- Code -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Code</label>
            <InputText
              v-model="code"
              placeholder="Brand code (e.g. NIK)"
              fluid
            />
          </div>

          <!-- Sort Order -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Sort Order</label
            >
            <InputNumber v-model="sortOrder" :min="0" fluid />
          </div>

          <!-- Is Active -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Active</label>
            <ToggleSwitch v-model="isActive" />
          </div>
        </div>
      </div>

      <!-- Card: Description -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Description</h2>
        <div class="flex flex-col gap-1">
          <Textarea
            v-model="description"
            placeholder="Brand description"
            rows="4"
            fluid
          />
        </div>
      </div>

      <!-- Card: Image -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Image</h2>
        <FileUpload
          accept="image/*"
          :auto="false"
          :show-upload-button="false"
          @select="onImageSelect"
          @clear="onImageClear"
        >
          <template #header="{ chooseCallback, clearCallback }">
            <div class="flex items-center gap-2">
              <Button
                type="button"
                icon="pi pi-image"
                label="Choose"
                @click="chooseCallback"
                outlined
                severity="secondary"
              />
              <Button
                type="button"
                icon="pi pi-times"
                label="Clear"
                @click="clearCallback"
                outlined
                severity="danger"
                :disabled="!image && !existingImage"
              />
            </div>
          </template>
          <template #content>
            <div
              v-if="image || existingImage"
              class="flex flex-wrap gap-4 mt-2"
            >
              <!-- Existing image from server -->
              <div v-if="existingImage && !image" class="relative">
                <img
                  :src="existingImage.thumb || existingImage.url"
                  :alt="existingImage.name || 'Current image'"
                  class="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <span
                  class="block text-xs text-slate-500 mt-1 truncate max-w-28"
                >
                  {{ existingImage.name || "Current image" }}
                </span>
                <Button
                  type="button"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  class="!absolute -top-2 -right-2"
                  @click="deleteExistingImage"
                />
              </div>
              <!-- New image preview -->
              <div v-if="image" class="relative">
                <img
                  :src="image.previewUrl"
                  :alt="image.file.name"
                  class="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <span
                  class="block text-xs text-slate-500 mt-1 truncate max-w-28"
                >
                  {{ image.file.name }}
                </span>
                <Button
                  type="button"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  class="!absolute -top-2 -right-2"
                  @click="removeNewImage"
                />
              </div>
            </div>
            <div v-else class="flex flex-col items-center py-6 text-slate-400">
              <i class="pi pi-cloud-upload text-4xl mb-2" />
              <p class="text-sm">Drag and drop an image here</p>
            </div>
          </template>
        </FileUpload>
      </div>

      <!-- Card: SEO / Meta -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO / Meta</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Meta Title</label
            >
            <InputText
              v-model="metaTitle"
              placeholder="Page title for search engines"
              fluid
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Meta Keywords</label
            >
            <InputText
              v-model="metaKeywords"
              placeholder="Comma-separated keywords"
              fluid
            />
          </div>

          <div class="md:col-span-2 flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Meta Description</label
            >
            <Textarea
              v-model="metaDescription"
              placeholder="Description for search engines"
              rows="3"
              fluid
            />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end">
        <Button
          type="submit"
          label="Update Brand"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>
