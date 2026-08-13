<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useCategoryStore } from "~/stores/category";
import { CATEGORIES, MEDIA } from "~/constants/endpoints";
import {
  buildCategoryTree,
  getTreeSelectionValue,
  toTreeSelectionValue,
} from "~/utils/categoryTree";

const route = useRoute();
const id = route.params.id;
const categoryStore = useCategoryStore();

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
const parentSelection = ref(null);
const description = ref("");
const metaTitle = ref("");
const metaKeywords = ref("");
const metaDescription = ref("");
const sortOrder = ref(0);
const isActive = ref(true);

// --- Image handling ---
const image = ref(null);
const existingImage = ref(null);
const imageError = ref("");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const MAX_IMAGE_SIZE = 500 * 1024; // 500kb

function onImageSelect(event) {
  const file = event.files[0];
  if (!file) return;
  imageError.value = "";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    imageError.value = "Only JPG, PNG, and GIF images are allowed.";
    return;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    imageError.value = "Image must be less than 500KB.";
    return;
  }
  if (image.value) URL.revokeObjectURL(image.value.previewUrl);
  existingImage.value = null;
  image.value = { file, previewUrl: URL.createObjectURL(file) };
}

function removeNewImage() {
  if (image.value) {
    URL.revokeObjectURL(image.value.previewUrl);
    image.value = null;
  }
  imageError.value = "";
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
  imageError.value = "";
}

onBeforeUnmount(() => {
  if (image.value) URL.revokeObjectURL(image.value.previewUrl);
});

// --- Parent category options ---
const parentOptions = ref([]);

// --- UI state ---
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});

// --- Load category data ---
onMounted(async () => {
  try {
    const api = useApiClient();
    const [, catRes] = await Promise.all([
      categoryStore.fetchCategory(id),
      api.get(`${CATEGORIES.LIST}?per_page=100`),
    ]);

    parentOptions.value = buildCategoryTree(
      (catRes.data || []).filter((c) => String(c.id) !== String(id)),
    );

    const c = categoryStore.category;
    if (!c) {
      navigateTo("/categories");
      return;
    }
    initialValues.value = {
      name: c.name || "",
    };
    parentSelection.value = toTreeSelectionValue(c.parent_id);
    description.value = c.description || "";
    sortOrder.value = c.sort_order ?? 0;
    isActive.value = c.is_active ?? true;
    metaTitle.value = c.meta_title || "";
    metaKeywords.value = c.meta_keywords || "";
    metaDescription.value = c.meta_description || "";
    if (c.image) existingImage.value = c.image;
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
    const parentId = getTreeSelectionValue(parentSelection.value);
    if (parentId) formData.append("parent_id", parentId);
    if (description.value) formData.append("description", description.value);
    formData.append("sort_order", sortOrder.value ?? 0);
    formData.append("is_active", isActive.value ? "1" : "0");
    if (metaTitle.value) formData.append("meta_title", metaTitle.value);
    if (metaKeywords.value)
      formData.append("meta_keywords", metaKeywords.value);
    if (metaDescription.value)
      formData.append("meta_description", metaDescription.value);
    if (image.value) formData.append("photo", image.value.file);

    await categoryStore.updateCategory(id, formData);
    navigateTo(`/categories/${id}`);
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
      <NuxtLink :to="`/categories/${id}`">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Category</h1>
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
            <InputText
              id="name"
              name="name"
              placeholder="Category name"
              fluid
            />
            <Message
              v-if="$form.name?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <!-- Parent Category -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Parent Category</label
            >
            <TreeSelect
              v-model="parentSelection"
              :options="parentOptions"
              placeholder="Select parent (optional)"
              selection-mode="checkbox"
              display="chip"
              filter
              show-clear
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
            placeholder="Category description"
            rows="4"
            fluid
          />
        </div>
      </div>

      <!-- Card: Image -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Image</h2>
        <FileUpload
          accept="image/jpeg,image/jpg,image/png,image/gif"
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
        <Message v-if="imageError" severity="error" size="small" variant="simple" class="mt-2">
          {{ imageError }}
        </Message>
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
          label="Update Category"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>
