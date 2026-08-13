<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import { useCategoryStore } from "~/stores/category";
import { CATEGORIES } from "~/constants/endpoints";
import { buildCategoryTree, getTreeSelectionValue } from "~/utils/categoryTree";

const categoryStore = useCategoryStore();

const resolver = yupResolver(
  object({
    name: string()
      .required("Name is required")
      .min(2, "Min 2 characters")
      .max(255, "Max 255 characters"),
  }),
);

const initialValues = {
  name: "",
};

// --- Optional fields ---
const parentSelection = ref(null);
const description = ref("");
const metaTitle = ref("");
const metaKeywords = ref("");
const metaDescription = ref("");
const sortOrder = ref(0);
const isActive = ref(true);

// --- Image (single) ---
const image = ref(null);
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
  image.value = { file, previewUrl: URL.createObjectURL(file) };
}

function removeImage() {
  if (image.value) {
    URL.revokeObjectURL(image.value.previewUrl);
    image.value = null;
  }
  imageError.value = "";
}

function onImageClear() {
  removeImage();
}

onBeforeUnmount(() => {
  if (image.value) URL.revokeObjectURL(image.value.previewUrl);
});

// --- Parent category options ---
const parentOptions = ref([]);

onMounted(async () => {
  const api = useApiClient();
  const res = await api.get(`${CATEGORIES.LIST}?per_page=100`);
  parentOptions.value = buildCategoryTree(res.data || []);
});

// --- UI state ---
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});

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

    const response = await categoryStore.createCategory(formData);
    navigateTo(`/categories/${response.data.id}`);
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
      <NuxtLink to="/categories">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Create Category</h1>
    </div>

    <Form
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
            <label class="text-sm font-medium text-slate-700">Sort Order</label>
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

      <!-- Card 2: Image -->
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
                :disabled="!image"
              />
            </div>
          </template>
          <template #content>
            <div v-if="image" class="flex flex-wrap gap-4 mt-2">
              <div class="relative">
                <img
                  :src="image.previewUrl"
                  :alt="image.file.name"
                  class="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <span
                  class="block text-xs text-slate-500 mt-1 truncate max-w-28"
                  >{{ image.file.name }}</span
                >
                <Button
                  type="button"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  class="!absolute -top-2 -right-2"
                  @click="removeImage"
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
            <label class="text-sm font-medium text-slate-700">Meta Title</label>
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
          label="Create Category"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>
