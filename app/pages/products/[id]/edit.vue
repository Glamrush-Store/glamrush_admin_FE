<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import CategoryTreeMultiSelect from "~/components/products/CategoryTreeMultiSelect.vue";
import { useProductStore } from "~/stores/product";
import { PRODUCTS, CATEGORIES, BRANDS, VENDORS, MEDIA } from "~/constants/endpoints";
import {
  buildCategorySequences,
  buildCategoryTree,
  flattenCategoryTree,
  getPrimaryProductCategory,
  getProductCategories,
} from "~/utils/categoryTree";

const route = useRoute();
const id = route.params.id;
const productStore = useProductStore();

const resolver = yupResolver(
  object({
    name: string()
      .required("Name is required")
      .min(2, "Min 2 characters")
      .max(255, "Max 255 characters"),
    status: string()
      .required("Status is required")
      .oneOf(["draft", "published", "archived"], "Invalid status"),
    brand_id: string().required("Brand is required"),
    vendor_id: string().required("Vendor is required"),
    short_description: string().max(500, "Max 500 characters"),
    description: string().max(5000, "Max 5000 characters"),
    meta_title: string().max(255, "Max 255 characters"),
    meta_keywords: string().max(500, "Max 500 characters"),
    meta_description: string().max(1000, "Max 1000 characters"),
  }),
);

const initialValues = ref({
  name: "",
  status: "draft",
  brand_id: "",
  vendor_id: "",
  short_description: "",
  description: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
});

// --- Product type (read-only) ---
const productType = ref("simple");

// --- Pricing (simple products) ---
const pricing = reactive({
  price: null,
  sale_price: null,
  sale_starts_at: null,
  sale_ends_at: null,
});

// --- Inventory (simple products) ---
const inventory = reactive({
  manage_stock: false,
  stock_quantity: 0,
  in_stock: true,
});

// --- Flags ---
const isFeatured = ref(false);
const sortOrder = ref(0);

// --- Images ---
const existingImages = ref([]);
const newImages = ref([]);

async function deleteExistingImage(imageId) {
  try {
    const api = useApiClient();
    await api.del(MEDIA.DELETE(imageId));
    existingImages.value = existingImages.value.filter((img) => img.id !== imageId);
  } catch (e) {
    serverError.value = "Failed to delete image";
  }
}

function onImageSelect(event) {
  const files = Array.from(event.files);
  for (const file of files) {
    const alreadyAdded = newImages.value.some(
      (img) => img.file.name === file.name && img.file.size === file.size,
    );
    if (!alreadyAdded) {
      newImages.value.push({ file, previewUrl: URL.createObjectURL(file) });
    }
  }
}

function removeNewImage(index) {
  URL.revokeObjectURL(newImages.value[index].previewUrl);
  newImages.value.splice(index, 1);
}

function onImageClear() {
  newImages.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  newImages.value = [];
}

onBeforeUnmount(() => {
  newImages.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
});

// --- Dropdown options ---
const categoryOptions = ref([]);
const brandOptions = ref([]);
const vendorOptions = ref([]);
const primaryCategoryId = ref(null);
const orderedCategoryIds = ref([]);

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

// --- UI state ---
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});

const categoryLookup = computed(() => {
  return flattenCategoryTree(categoryOptions.value).reduce((lookup, node) => {
    lookup[node.key] = node.data;
    return lookup;
  }, {});
});

const selectedCategories = computed(() =>
  orderedCategoryIds.value.map((id) => ({
    id,
    name: categoryLookup.value[id]?.name || `Category ${id}`,
  })),
);

watch(orderedCategoryIds, (ids) => {
  if (ids.length === 1 || !ids.includes(primaryCategoryId.value)) {
    primaryCategoryId.value = orderedCategoryIds.value[0] || null;
  }
});

function moveSelectedCategory(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= orderedCategoryIds.value.length) return;

  const next = [...orderedCategoryIds.value];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  orderedCategoryIds.value = next;
}

function appendCategoryPayload(formData, categoryIds) {
  categoryIds.forEach((categoryId, index) => {
    formData.append(`category_ids[${index}]`, categoryId);
  });
  formData.append("primary_category_id", primaryCategoryId.value);

  const sequences = buildCategorySequences(categoryIds);
  Object.entries(sequences).forEach(([categoryId, sequence]) => {
    formData.append(`category_sequences[${categoryId}]`, sequence);
  });
}

function buildCategoryPayload(categoryIds) {
  return {
    category_ids: categoryIds,
    primary_category_id: primaryCategoryId.value,
    category_sequences: buildCategorySequences(categoryIds),
  };
}

function validateCategoryAssignment() {
  const errors = {};
  const categoryIds = orderedCategoryIds.value;

  if (categoryIds.length === 0) {
    errors.category_ids = "At least one category is required";
  }

  if (!primaryCategoryId.value) {
    errors.primary_category_id = "Primary category is required";
  } else if (!categoryIds.includes(primaryCategoryId.value)) {
    errors.primary_category_id =
      "Primary category must be one of the selected categories";
  }

  return errors;
}

// --- Sale field cross-validation ---
function validateSaleFields(obj, prefix) {
  const errors = {};
  const hasSalePrice = obj.sale_price != null && obj.sale_price !== "";
  const hasSaleStart = obj.sale_starts_at != null;
  const hasSaleEnd = obj.sale_ends_at != null;

  if (hasSalePrice || hasSaleStart || hasSaleEnd) {
    if (!hasSalePrice || obj.sale_price <= 0) {
      errors[`${prefix}sale_price`] =
        "Sale price is required and must be greater than 0";
    } else if (obj.price && obj.sale_price >= obj.price) {
      errors[`${prefix}sale_price`] = "Sale price must be less than price";
    }
    if (!hasSaleStart) {
      errors[`${prefix}sale_starts_at`] = "Sale start date is required";
    }
    if (!hasSaleEnd) {
      errors[`${prefix}sale_ends_at`] = "Sale end date is required";
    }
    if (
      hasSaleStart &&
      hasSaleEnd &&
      new Date(obj.sale_ends_at) <= new Date(obj.sale_starts_at)
    ) {
      errors[`${prefix}sale_ends_at`] = "End date must be after start date";
    }
  }
  return errors;
}

// --- Load product and dropdown data ---
onMounted(async () => {
  try {
    const api = useApiClient();
    const [catRes, brandRes, vendorRes] = await Promise.all([
      api.get(`${CATEGORIES.LIST}?per_page=100`),
      api.get(`${BRANDS.LIST}?per_page=100`),
      api.get(`${VENDORS.LIST}?per_page=100`),
      productStore.fetchProduct(id),
    ]);

    categoryOptions.value = buildCategoryTree(catRes.data || []);
    brandOptions.value = brandRes.data.map((b) => ({
      label: b.name,
      value: String(b.id),
    }));
    vendorOptions.value = vendorRes.data.map((v) => ({
      label: v.business_name || v.name,
      value: String(v.id),
    }));

    const p = productStore.product;
    if (!p) {
      navigateTo("/products");
      return;
    }

    productType.value = p.type;

    initialValues.value = {
      name: p.name || "",
      status: p.status || "draft",
      brand_id: p.brand?.id ? String(p.brand.id) : "",
      vendor_id: p.vendor?.id ? String(p.vendor.id) : "",
      short_description: p.short_description || "",
      description: p.description || "",
      meta_title: p.meta?.title || "",
      meta_keywords: p.meta?.keywords || "",
      meta_description: p.meta?.description || "",
    };

    const productCategories = getProductCategories(p);
    const categoryIds = productCategories.map((category) => String(category.id));
    const primaryCategory = getPrimaryProductCategory(p);

    orderedCategoryIds.value = [...categoryIds].sort((a, b) => {
      const aCategory = productCategories.find((category) => String(category.id) === a);
      const bCategory = productCategories.find((category) => String(category.id) === b);
      return (aCategory?.sequence ?? 0) - (bCategory?.sequence ?? 0);
    });
    primaryCategoryId.value =
      primaryCategory?.id && orderedCategoryIds.value.includes(String(primaryCategory.id))
        ? String(primaryCategory.id)
        : orderedCategoryIds.value[0] || null;

    // Pricing
    if (p.pricing) {
      pricing.price = p.pricing.price ? Number(p.pricing.price) : null;
      pricing.sale_price = p.pricing.sale_price
        ? Number(p.pricing.sale_price)
        : null;
      pricing.sale_starts_at = p.pricing.sale_starts_at
        ? new Date(p.pricing.sale_starts_at)
        : null;
      pricing.sale_ends_at = p.pricing.sale_ends_at
        ? new Date(p.pricing.sale_ends_at)
        : null;
    }

    // Inventory
    if (p.inventory) {
      inventory.manage_stock = p.inventory.manage_stock ?? false;
      inventory.stock_quantity = p.inventory.stock_quantity ?? 0;
      inventory.in_stock = p.inventory.in_stock ?? true;
    }

    // Flags
    isFeatured.value = p.flags?.is_featured ?? false;
    sortOrder.value = p.flags?.sort_order ?? 0;

    // Images
    existingImages.value = p.images || [];
  } finally {
    pageLoading.value = false;
  }
});

// --- Form submission ---
async function onSubmit({ valid, values }) {
  if (!valid) return;

  const errors = {};
  Object.assign(errors, validateCategoryAssignment());

  if (productType.value === "simple") {
    if (!pricing.price || pricing.price <= 0) {
      errors.price = "Price is required and must be greater than 0";
    }
    if (inventory.stock_quantity == null || inventory.stock_quantity < 0) {
      errors.stock_quantity = "Stock quantity must be 0 or greater";
    }
    Object.assign(errors, validateSaleFields(pricing, ""));
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors;
    return;
  }

  validationErrors.value = {};
  loading.value = true;
  serverError.value = "";

  try {
    const hasNewImages = newImages.value.length > 0;

    if (hasNewImages) {
      // Use FormData when uploading new images
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("status", values.status);
      appendCategoryPayload(formData, orderedCategoryIds.value);
      formData.append("brand_id", values.brand_id);
      formData.append("vendor_id", values.vendor_id);
      formData.append("is_featured", isFeatured.value ? "1" : "0");
      formData.append("sort_order", sortOrder.value ?? 0);

      if (values.short_description)
        formData.append("short_description", values.short_description);
      if (values.description)
        formData.append("description", values.description);
      if (values.meta_title)
        formData.append("meta_title", values.meta_title);
      if (values.meta_keywords)
        formData.append("meta_keywords", values.meta_keywords);
      if (values.meta_description)
        formData.append("meta_description", values.meta_description);

      if (productType.value === "simple") {
        formData.append("price", pricing.price);
        if (pricing.sale_price)
          formData.append("sale_price", pricing.sale_price);
        if (pricing.sale_starts_at)
          formData.append(
            "sale_starts_at",
            pricing.sale_starts_at.toISOString(),
          );
        if (pricing.sale_ends_at)
          formData.append("sale_ends_at", pricing.sale_ends_at.toISOString());
        formData.append("manage_stock", inventory.manage_stock ? "1" : "0");
        formData.append("stock_quantity", inventory.stock_quantity);
        formData.append("in_stock", inventory.in_stock ? "1" : "0");
      }

      newImages.value.forEach((img) => {
        formData.append("photos[]", img.file);
      });

      const api = useApiClient();
      await api.putFormData(PRODUCTS.UPDATE(id), formData);
    } else {
      // JSON when no new images
      const payload = {
        name: values.name,
        status: values.status,
        ...buildCategoryPayload(orderedCategoryIds.value),
        brand_id: values.brand_id,
        vendor_id: values.vendor_id,
        is_featured: isFeatured.value,
        sort_order: sortOrder.value ?? 0,
      };

      if (values.short_description)
        payload.short_description = values.short_description;
      if (values.description) payload.description = values.description;
      if (values.meta_title) payload.meta_title = values.meta_title;
      if (values.meta_keywords) payload.meta_keywords = values.meta_keywords;
      if (values.meta_description)
        payload.meta_description = values.meta_description;

      if (productType.value === "simple") {
        payload.price = pricing.price;
        if (pricing.sale_price) payload.sale_price = pricing.sale_price;
        if (pricing.sale_starts_at)
          payload.sale_starts_at = pricing.sale_starts_at.toISOString();
        if (pricing.sale_ends_at)
          payload.sale_ends_at = pricing.sale_ends_at.toISOString();
        payload.manage_stock = inventory.manage_stock;
        payload.stock_quantity = inventory.stock_quantity;
        payload.in_stock = inventory.in_stock;
      }

      await productStore.updateProduct(id, payload);
    }

    navigateTo(`/products/${id}`);
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
      <NuxtLink :to="`/products/${id}`">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Edit Product</h1>
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
            <InputText id="name" name="name" placeholder="Product name" fluid />
            <Message
              v-if="$form.name?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.name.error?.message }}
            </Message>
          </div>

          <!-- Type (read-only) -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Type</label>
            <InputText
              :model-value="productType"
              disabled
              fluid
              class="capitalize"
            />
            <small class="text-slate-400"
              >Type cannot be changed after creation</small
            >
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-1">
            <label for="status" class="text-sm font-medium text-slate-700"
              >Status *</label
            >
            <Select
              id="status"
              name="status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Select status"
              fluid
            />
            <Message
              v-if="$form.status?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.status.error?.message }}
            </Message>
          </div>

          <!-- Categories -->
          <div class="md:col-span-2 flex flex-col gap-3">
            <label
              for="category_ids"
              class="text-sm font-medium text-slate-700"
              >Categories *</label
            >
            <CategoryTreeMultiSelect
              id="category_ids"
              v-model="orderedCategoryIds"
              input-id="category_ids"
              :options="categoryOptions"
              placeholder="Select categories"
            />
            <Message
              v-if="validationErrors.category_ids"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ validationErrors.category_ids }}
            </Message>

            <div
              v-if="selectedCategories.length > 0"
              class="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div class="mb-3">
                <label
                  for="primary_category_id"
                  class="text-sm font-medium text-slate-700"
                  >Primary Category *</label
                >
                <Select
                  id="primary_category_id"
                  v-model="primaryCategoryId"
                  :options="selectedCategories"
                  option-label="name"
                  option-value="id"
                  placeholder="Select primary category"
                  fluid
                  class="mt-1"
                />
                <Message
                  v-if="validationErrors.primary_category_id"
                  severity="error"
                  size="small"
                  variant="simple"
                  class="mt-1"
                >
                  {{ validationErrors.primary_category_id }}
                </Message>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(category, index) in selectedCategories"
                  :key="category.id"
                  class="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="text-xs font-semibold text-slate-400">
                      {{ index + 1 }}
                    </span>
                    <span class="truncate text-sm font-medium text-slate-800">
                      {{ category.name }}
                    </span>
                    <Tag
                      v-if="category.id === primaryCategoryId"
                      value="Primary"
                      severity="success"
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <Button
                      type="button"
                      icon="pi pi-arrow-up"
                      severity="secondary"
                      text
                      rounded
                      size="small"
                      :disabled="index === 0"
                      @click="moveSelectedCategory(index, -1)"
                    />
                    <Button
                      type="button"
                      icon="pi pi-arrow-down"
                      severity="secondary"
                      text
                      rounded
                      size="small"
                      :disabled="index === selectedCategories.length - 1"
                      @click="moveSelectedCategory(index, 1)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Brand -->
          <div class="flex flex-col gap-1">
            <label for="brand_id" class="text-sm font-medium text-slate-700"
              >Brand *</label
            >
            <Select
              id="brand_id"
              name="brand_id"
              :options="brandOptions"
              option-label="label"
              option-value="value"
              placeholder="Select brand"
              filter
              fluid
            />
            <Message
              v-if="$form.brand_id?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.brand_id.error?.message }}
            </Message>
          </div>

          <!-- Vendor -->
          <div class="flex flex-col gap-1">
            <label for="vendor_id" class="text-sm font-medium text-slate-700"
              >Vendor *</label
            >
            <Select
              id="vendor_id"
              name="vendor_id"
              :options="vendorOptions"
              option-label="label"
              option-value="value"
              placeholder="Select vendor"
              filter
              fluid
            />
            <Message
              v-if="$form.vendor_id?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.vendor_id.error?.message }}
            </Message>
          </div>

          <!-- Short Description (full width) -->
          <div class="md:col-span-2 flex flex-col gap-1">
            <label
              for="short_description"
              class="text-sm font-medium text-slate-700"
              >Short Description</label
            >
            <Textarea
              id="short_description"
              name="short_description"
              placeholder="Brief product summary"
              rows="2"
              fluid
            />
            <Message
              v-if="$form.short_description?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.short_description.error?.message }}
            </Message>
          </div>

          <!-- Description (full width) -->
          <div class="md:col-span-2 flex flex-col gap-1">
            <label for="description" class="text-sm font-medium text-slate-700"
              >Description</label
            >
            <Textarea
              id="description"
              name="description"
              placeholder="Full product description"
              rows="5"
              fluid
            />
            <Message
              v-if="$form.description?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.description.error?.message }}
            </Message>
          </div>
        </div>
      </div>

      <!-- Card 2: Pricing (simple only) -->
      <div
        v-if="productType === 'simple'"
        class="bg-white rounded-lg border border-slate-200 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Pricing</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Price *</label>
            <InputNumber
              v-model="pricing.price"
              mode="currency"
              currency="NGN"
              :min="0"
              fluid
            />
            <Message
              v-if="validationErrors.price"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ validationErrors.price }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Sale Price</label
            >
            <InputNumber
              v-model="pricing.sale_price"
              mode="currency"
              currency="NGN"
              :min="0"
              fluid
            />
            <Message
              v-if="validationErrors.sale_price"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ validationErrors.sale_price }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Sale Starts At</label
            >
            <DatePicker
              v-model="pricing.sale_starts_at"
              show-time
              placeholder="Select date"
              fluid
            />
            <Message
              v-if="validationErrors.sale_starts_at"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ validationErrors.sale_starts_at }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Sale Ends At</label
            >
            <DatePicker
              v-model="pricing.sale_ends_at"
              show-time
              placeholder="Select date"
              fluid
            />
            <Message
              v-if="validationErrors.sale_ends_at"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ validationErrors.sale_ends_at }}
            </Message>
          </div>
        </div>
      </div>

      <!-- Card 3: Inventory (simple only) -->
      <div
        v-if="productType === 'simple'"
        class="bg-white rounded-lg border border-slate-200 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Inventory</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Manage Stock</label
            >
            <ToggleSwitch v-model="inventory.manage_stock" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Stock Quantity *</label
            >
            <InputNumber v-model="inventory.stock_quantity" :min="0" fluid />
            <Message
              v-if="validationErrors.stock_quantity"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ validationErrors.stock_quantity }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">In Stock</label>
            <ToggleSwitch v-model="inventory.in_stock" />
          </div>
        </div>
      </div>

      <!-- Card: Images -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Images</h2>

        <!-- Existing images -->
        <div v-if="existingImages.length > 0" class="mb-4">
          <label class="text-sm font-medium text-slate-700 block mb-2"
            >Current Images</label
          >
          <div class="flex flex-wrap gap-4">
            <div
              v-for="img in existingImages"
              :key="img.id"
              class="relative"
            >
              <img
                :src="img.thumb || img.url"
                :alt="img.name"
                class="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
              />
              <span
                class="block text-xs text-slate-500 mt-1 truncate max-w-28"
              >
                {{ img.name }}
              </span>
              <Button
                type="button"
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                size="small"
                class="!absolute -top-2 -right-2"
                @click="deleteExistingImage(img.id)"
              />
            </div>
          </div>
        </div>

        <!-- New image upload -->
        <label class="text-sm font-medium text-slate-700 block mb-2"
          >Upload New Images</label
        >
        <FileUpload
          :multiple="true"
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
                icon="pi pi-images"
                label="Choose"
                size="small"
                @click="chooseCallback"
                outlined
                severity="secondary"
              />
              <Button
                type="button"
                icon="pi pi-times"
                label="Clear"
                size="small"
                @click="clearCallback"
                outlined
                severity="danger"
                :disabled="newImages.length === 0"
              />
            </div>
          </template>
          <template #content>
            <div v-if="newImages.length > 0" class="flex flex-wrap gap-4 mt-2">
              <div
                v-for="(img, i) in newImages"
                :key="i"
                class="relative"
              >
                <img
                  :src="img.previewUrl"
                  :alt="img.file.name"
                  class="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <span
                  class="block text-xs text-slate-500 mt-1 truncate max-w-28"
                >
                  {{ img.file.name }}
                </span>
                <Button
                  type="button"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  class="!absolute -top-2 -right-2"
                  @click="removeNewImage(i)"
                />
              </div>
            </div>
            <div
              v-else
              class="flex items-center gap-2 py-3 text-slate-400 text-sm"
            >
              <i class="pi pi-cloud-upload" /> Drag and drop images here
            </div>
          </template>
        </FileUpload>
      </div>

      <!-- Card 4: SEO / Meta -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO / Meta</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="meta_title" class="text-sm font-medium text-slate-700"
              >Meta Title</label
            >
            <InputText
              id="meta_title"
              name="meta_title"
              placeholder="Page title for search engines"
              fluid
            />
            <Message
              v-if="$form.meta_title?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.meta_title.error?.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label
              for="meta_keywords"
              class="text-sm font-medium text-slate-700"
              >Meta Keywords</label
            >
            <InputText
              id="meta_keywords"
              name="meta_keywords"
              placeholder="Comma-separated keywords"
              fluid
            />
            <Message
              v-if="$form.meta_keywords?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.meta_keywords.error?.message }}
            </Message>
          </div>

          <div class="md:col-span-2 flex flex-col gap-1">
            <label
              for="meta_description"
              class="text-sm font-medium text-slate-700"
              >Meta Description</label
            >
            <Textarea
              id="meta_description"
              name="meta_description"
              placeholder="Description for search engines"
              rows="3"
              fluid
            />
            <Message
              v-if="$form.meta_description?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.meta_description.error?.message }}
            </Message>
          </div>
        </div>
      </div>

      <!-- Card 5: Flags -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Flags</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Featured Product</label
            >
            <ToggleSwitch v-model="isFeatured" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Sort Order</label
            >
            <InputNumber v-model="sortOrder" :min="0" fluid />
          </div>
        </div>
      </div>

      <!-- Info: Variable product variants -->
      <Message
        v-if="productType === 'variable'"
        severity="info"
        :closable="false"
        class="mb-6"
      >
        Variants are managed individually from the product detail page.
      </Message>

      <!-- Submit -->
      <div class="flex justify-end">
        <Button
          type="submit"
          label="Update Product"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>
