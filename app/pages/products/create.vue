<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { ApiError } from "~/composables/apiClient";
import CategoryTreeMultiSelect from "~/components/products/CategoryTreeMultiSelect.vue";
import { useProductStore } from "~/stores/product";
import { useAttributeCodeStore } from "~/stores/attributeCode";
import { CATEGORIES, BRANDS, VENDORS } from "~/constants/endpoints";
import {
  buildCategorySequences,
  buildCategoryTree,
  flattenCategoryTree,
} from "~/utils/categoryTree";

const productStore = useProductStore();
const attributeCodeStore = useAttributeCodeStore();

// --- Yup schema for static required fields ---
const resolver = yupResolver(
  object({
    name: string()
      .required("Name is required")
      .min(2, "Min 2 characters")
      .max(255, "Max 255 characters"),
    type: string()
      .required("Type is required")
      .oneOf(["simple", "variable"], "Invalid type"),
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

const initialValues = {
  name: "",
  type: "simple",
  status: "draft",
  brand_id: "",
  vendor_id: "",
  short_description: "",
  description: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
};

// --- Reactive state for type tracking ---
const selectedType = ref("simple");

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

// --- Product images (array of { file, previewUrl }) ---
const productImages = ref([]);

// --- Variants (variable products) ---
const variants = ref([]);

// --- Dropdown options ---
const categoryOptions = ref([]);
const brandOptions = ref([]);
const vendorOptions = ref([]);
const primaryCategoryId = ref(null);
const orderedCategoryIds = ref([]);

const typeOptions = [
  { label: "Simple", value: "simple" },
  { label: "Variable", value: "variable" },
];

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const variantStatusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// --- UI state ---
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

// --- Fetch dropdown data ---
onMounted(async () => {
  const api = useApiClient();

  const [catRes, brandRes, vendorRes] = await Promise.all([
    api.get(`${CATEGORIES.LIST}?per_page=100`),
    api.get(`${BRANDS.LIST}?per_page=100`),
    api.get(`${VENDORS.LIST}?per_page=100`),
    attributeCodeStore.fetchTypes(),
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
});

// --- Variant management ---
function addVariant() {
  variants.value.push({
    attributes: [],
    is_default: variants.value.length === 0,
    price: null,
    sale_price: null,
    sale_starts_at: null,
    sale_ends_at: null,
    manage_stock: false,
    stock_quantity: 0,
    in_stock: true,
    sort_order: 0,
    status: "active",
    images: [],
  });
}

function removeVariant(index) {
  const wasDefault = variants.value[index].is_default;
  variants.value[index].images.forEach((img) =>
    URL.revokeObjectURL(img.previewUrl),
  );
  variants.value.splice(index, 1);
  if (wasDefault && variants.value.length > 0) {
    variants.value[0].is_default = true;
  }
}

function setDefaultVariant(index) {
  variants.value.forEach((v, i) => {
    v.is_default = i === index;
  });
}

// --- Attribute management per variant ---
function addAttribute(variantIndex) {
  variants.value[variantIndex].attributes.push({ type: "", value: "" });
}

function removeAttribute(variantIndex, attrIndex) {
  variants.value[variantIndex].attributes.splice(attrIndex, 1);
}

function availableTypesForVariant(variantIndex) {
  const usedTypes = variants.value[variantIndex].attributes.map((a) => a.type);
  return attributeCodeStore.types.filter((t) => !usedTypes.includes(t.value));
}

function onAttributeTypeChange(variantIndex, attrIndex, newType) {
  variants.value[variantIndex].attributes[attrIndex].type = newType;
  variants.value[variantIndex].attributes[attrIndex].value = "";
  if (newType) {
    attributeCodeStore.fetchActiveByType(newType);
  }
}

// --- Image handling ---
function onProductImageSelect(event) {
  const files = Array.from(event.files);
  for (const file of files) {
    const alreadyAdded = productImages.value.some(
      (img) => img.file.name === file.name && img.file.size === file.size,
    );
    if (!alreadyAdded) {
      productImages.value.push({ file, previewUrl: URL.createObjectURL(file) });
    }
  }
}

function removeProductImage(index) {
  URL.revokeObjectURL(productImages.value[index].previewUrl);
  productImages.value.splice(index, 1);
}

function onProductImageClear() {
  productImages.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  productImages.value = [];
}

function onVariantImageSelect(variantIndex, event) {
  const files = Array.from(event.files);
  const variant = variants.value[variantIndex];
  for (const file of files) {
    const alreadyAdded = variant.images.some(
      (img) => img.file.name === file.name && img.file.size === file.size,
    );
    if (!alreadyAdded) {
      variant.images.push({ file, previewUrl: URL.createObjectURL(file) });
    }
  }
}

function removeVariantImage(variantIndex, imageIndex) {
  URL.revokeObjectURL(
    variants.value[variantIndex].images[imageIndex].previewUrl,
  );
  variants.value[variantIndex].images.splice(imageIndex, 1);
}

function clearVariantImages(variantIndex) {
  variants.value[variantIndex].images.forEach((img) =>
    URL.revokeObjectURL(img.previewUrl),
  );
  variants.value[variantIndex].images = [];
}

// --- Cleanup blob URLs on unmount ---
onBeforeUnmount(() => {
  productImages.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  variants.value.forEach((v) =>
    v.images.forEach((img) => URL.revokeObjectURL(img.previewUrl)),
  );
});

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

// --- Form submission ---
async function onSubmit({ valid, values }) {
  if (!valid) return;

  const errors = {};
  Object.assign(errors, validateCategoryAssignment());

  // Manual validation for conditional fields
  if (selectedType.value === "simple") {
    if (!pricing.price || pricing.price <= 0) {
      errors.price = "Price is required and must be greater than 0";
    }
    if (inventory.stock_quantity == null || inventory.stock_quantity < 0) {
      errors.stock_quantity = "Stock quantity must be 0 or greater";
    }
    Object.assign(errors, validateSaleFields(pricing, ""));
  }

  if (selectedType.value === "variable") {
    if (variants.value.length === 0) {
      errors.variants = "At least one variant is required";
    } else {
      const hasDefault = variants.value.some((v) => v.is_default);
      if (!hasDefault) {
        errors.variants = "One variant must be set as default";
      }

      variants.value.forEach((v, i) => {
        if (!v.attributes || v.attributes.length === 0) {
          errors[`variants_${i}_attributes`] =
            "At least one attribute is required";
        } else {
          v.attributes.forEach((attr) => {
            if (!attr.type || !attr.value) {
              errors[`variants_${i}_attributes`] =
                "All attributes must have type and value selected";
            }
          });
        }
        if (!v.price || v.price <= 0) {
          errors[`variants_${i}_price`] = "Price is required";
        }
        if (v.stock_quantity == null || v.stock_quantity < 0) {
          errors[`variants_${i}_stock_quantity`] =
            "Stock quantity must be 0 or greater";
        }
        const saleErrors = validateSaleFields(v, `variants_${i}_`);
        Object.assign(errors, saleErrors);
      });
    }
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors;
    return;
  }

  validationErrors.value = {};
  loading.value = true;
  serverError.value = "";

  try {
    const formData = new FormData();

    // Static fields from Yup-validated values
    formData.append("name", values.name);
    formData.append("type", values.type);
    formData.append("status", values.status);
    appendCategoryPayload(formData, orderedCategoryIds.value);
    formData.append("brand_id", values.brand_id);
    formData.append("vendor_id", values.vendor_id);
    if (values.short_description)
      formData.append("short_description", values.short_description);
    if (values.description) formData.append("description", values.description);
    if (values.meta_title) formData.append("meta_title", values.meta_title);
    if (values.meta_keywords)
      formData.append("meta_keywords", values.meta_keywords);
    if (values.meta_description)
      formData.append("meta_description", values.meta_description);

    // Flags
    formData.append("is_featured", isFeatured.value ? "1" : "0");
    if (sortOrder.value != null) formData.append("sort_order", sortOrder.value);

    // Product images
    productImages.value.forEach((img, i) => {
      formData.append(`photos[${i}]`, img.file);
    });

    // Simple type: pricing & inventory
    if (selectedType.value === "simple") {
      formData.append("price", pricing.price);
      if (pricing.sale_price) formData.append("sale_price", pricing.sale_price);
      if (pricing.sale_starts_at)
        formData.append("sale_starts_at", pricing.sale_starts_at.toISOString());
      if (pricing.sale_ends_at)
        formData.append("sale_ends_at", pricing.sale_ends_at.toISOString());
      formData.append("manage_stock", inventory.manage_stock ? "1" : "0");
      formData.append("stock_quantity", inventory.stock_quantity);
      formData.append("in_stock", inventory.in_stock ? "1" : "0");
    }

    // Variable type: variants
    if (selectedType.value === "variable") {
      variants.value.forEach((v, i) => {
        formData.append(`variants[${i}][is_default]`, v.is_default ? "1" : "0");
        formData.append(`variants[${i}][price]`, v.price);
        if (v.sale_price)
          formData.append(`variants[${i}][sale_price]`, v.sale_price);
        if (v.sale_starts_at)
          formData.append(
            `variants[${i}][sale_starts_at]`,
            v.sale_starts_at.toISOString(),
          );
        if (v.sale_ends_at)
          formData.append(
            `variants[${i}][sale_ends_at]`,
            v.sale_ends_at.toISOString(),
          );
        formData.append(
          `variants[${i}][manage_stock]`,
          v.manage_stock ? "1" : "0",
        );
        formData.append(`variants[${i}][stock_quantity]`, v.stock_quantity);
        formData.append(`variants[${i}][in_stock]`, v.in_stock ? "1" : "0");
        if (v.sort_order != null)
          formData.append(`variants[${i}][sort_order]`, v.sort_order);
        formData.append(`variants[${i}][status]`, v.status || "active");
        if (v.attributes) {
          v.attributes.forEach((attr, j) => {
            formData.append(
              `variants[${i}][attributes][${j}][type]`,
              attr.type,
            );
            formData.append(
              `variants[${i}][attributes][${j}][value]`,
              attr.value,
            );
          });
        }
        if (v.images) {
          v.images.forEach((img, j) => {
            formData.append(`variants[${i}][photos][${j}]`, img.file);
          });
        }
      });
    }

    const response = await productStore.createProduct(formData);
    navigateTo(`/products/${response.data.id}`);
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
      <NuxtLink to="/products">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-slate-900">Create Product</h1>
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

          <!-- Type -->
          <div class="flex flex-col gap-1">
            <label for="type" class="text-sm font-medium text-slate-700"
              >Type *</label
            >
            <Select
              id="type"
              name="type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              placeholder="Select type"
              fluid
              @update:model-value="(v) => (selectedType = v)"
            />
            <Message
              v-if="$form.type?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.type.error?.message }}
            </Message>
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

      <!-- Card 2: Product Images -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">
          Product Images
        </h2>
        <FileUpload
          :multiple="true"
          accept="image/*"
          :auto="false"
          :show-upload-button="false"
          @select="onProductImageSelect"
          @clear="onProductImageClear"
        >
          <template #header="{ chooseCallback, clearCallback }">
            <div class="flex items-center gap-2">
              <Button
                type="button"
                icon="pi pi-images"
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
                :disabled="productImages.length === 0"
              />
            </div>
          </template>
          <template #content>
            <div
              v-if="productImages.length > 0"
              class="flex flex-wrap gap-4 mt-2"
            >
              <div v-for="(img, i) in productImages" :key="i" class="relative">
                <img
                  :src="img.previewUrl"
                  :alt="img.file.name"
                  class="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <span
                  class="block text-xs text-slate-500 mt-1 truncate max-w-28"
                  >{{ img.file.name }}</span
                >
                <Button
                  type="button"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  class="!absolute -top-2 -right-2"
                  @click="removeProductImage(i)"
                />
              </div>
            </div>
            <div v-else class="flex flex-col items-center py-6 text-slate-400">
              <i class="pi pi-cloud-upload text-4xl mb-2" />
              <p class="text-sm">Drag and drop images here</p>
            </div>
          </template>
        </FileUpload>
      </div>

      <!-- Card 3: Pricing (simple only) -->
      <div
        v-if="selectedType === 'simple'"
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
            <label class="text-sm font-medium text-slate-700">Sale Price</label>
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

      <!-- Card 4: Inventory (simple only) -->
      <div
        v-if="selectedType === 'simple'"
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

      <!-- Card 5: SEO / Meta -->
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

      <!-- Card 6: Flags -->
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
            <label class="text-sm font-medium text-slate-700">Sort Order</label>
            <InputNumber v-model="sortOrder" :min="0" fluid />
          </div>
        </div>
      </div>

      <!-- Card 7: Variants (variable only) -->
      <div
        v-if="selectedType === 'variable'"
        class="bg-white rounded-lg border border-slate-200 p-6 mb-6"
      >
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Variants</h2>

        <Message
          v-if="validationErrors.variants"
          severity="error"
          size="small"
          variant="simple"
          class="mb-4"
        >
          {{ validationErrors.variants }}
        </Message>

        <div class="space-y-4">
          <div
            v-for="(variant, index) in variants"
            :key="index"
            class="border border-slate-200 rounded-lg p-4 relative"
          >
            <!-- Variant header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span class="font-medium text-slate-700"
                  >Variant {{ index + 1 }}</span
                >
                <div class="flex items-center gap-2">
                  <RadioButton
                    :model-value="variant.is_default"
                    :value="true"
                    @update:model-value="setDefaultVariant(index)"
                  />
                  <label class="text-sm text-slate-600">Default</label>
                </div>
              </div>
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                @click="removeVariant(index)"
              />
            </div>

            <!-- Attributes -->
            <div class="mb-4">
              <label class="text-sm font-medium text-slate-700 block mb-2"
                >Attributes *</label
              >
              <div class="space-y-2">
                <div
                  v-for="(attr, attrIdx) in variant.attributes"
                  :key="attrIdx"
                  class="flex items-center gap-2"
                >
                  <Select
                    :model-value="attr.type"
                    :options="
                      availableTypesForVariant(index).concat(
                        attr.type
                          ? attributeCodeStore.types.filter(
                              (t) => t.value === attr.type,
                            )
                          : [],
                      )
                    "
                    option-label="label"
                    option-value="value"
                    placeholder="Select type"
                    class="w-40"
                    @update:model-value="
                      (v) => onAttributeTypeChange(index, attrIdx, v)
                    "
                  />
                  <Select
                    v-model="attr.value"
                    :options="
                      attributeCodeStore.activeValuesByType[attr.type] || []
                    "
                    option-label="value"
                    option-value="value"
                    placeholder="Select value"
                    :disabled="!attr.type"
                    class="flex-1"
                  />
                  <Button
                    type="button"
                    icon="pi pi-times"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    @click="removeAttribute(index, attrIdx)"
                  />
                </div>
              </div>
              <Button
                type="button"
                icon="pi pi-plus"
                label="Add Attribute"
                severity="secondary"
                text
                size="small"
                class="mt-2"
                :disabled="
                  variant.attributes.length >=
                  attributeCodeStore.types.length
                "
                @click="addAttribute(index)"
              />
              <Message
                v-if="validationErrors[`variants_${index}_attributes`]"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ validationErrors[`variants_${index}_attributes`] }}
              </Message>
            </div>

            <!-- Variant fields -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Price -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Price *</label
                >
                <InputNumber
                  v-model="variant.price"
                  mode="currency"
                  currency="NGN"
                  :min="0"
                  fluid
                />
                <Message
                  v-if="validationErrors[`variants_${index}_price`]"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ validationErrors[`variants_${index}_price`] }}
                </Message>
              </div>

              <!-- Sale Price -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Sale Price</label
                >
                <InputNumber
                  v-model="variant.sale_price"
                  mode="currency"
                  currency="NGN"
                  :min="0"
                  fluid
                />
                <Message
                  v-if="validationErrors[`variants_${index}_sale_price`]"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ validationErrors[`variants_${index}_sale_price`] }}
                </Message>
              </div>

              <!-- Status -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700">Status</label>
                <Select
                  v-model="variant.status"
                  :options="variantStatusOptions"
                  option-label="label"
                  option-value="value"
                  fluid
                />
              </div>

              <!-- Sale Starts At -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Sale Starts At</label
                >
                <DatePicker
                  v-model="variant.sale_starts_at"
                  show-time
                  placeholder="Select date"
                  fluid
                />
                <Message
                  v-if="validationErrors[`variants_${index}_sale_starts_at`]"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ validationErrors[`variants_${index}_sale_starts_at`] }}
                </Message>
              </div>

              <!-- Sale Ends At -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Sale Ends At</label
                >
                <DatePicker
                  v-model="variant.sale_ends_at"
                  show-time
                  placeholder="Select date"
                  fluid
                />
                <Message
                  v-if="validationErrors[`variants_${index}_sale_ends_at`]"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ validationErrors[`variants_${index}_sale_ends_at`] }}
                </Message>
              </div>

              <!-- Sort Order -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Sort Order</label
                >
                <InputNumber v-model="variant.sort_order" :min="0" fluid />
              </div>

              <!-- Manage Stock -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Manage Stock</label
                >
                <ToggleSwitch v-model="variant.manage_stock" />
              </div>

              <!-- Stock Quantity -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >Stock Quantity *</label
                >
                <InputNumber v-model="variant.stock_quantity" :min="0" fluid />
                <Message
                  v-if="validationErrors[`variants_${index}_stock_quantity`]"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ validationErrors[`variants_${index}_stock_quantity`] }}
                </Message>
              </div>

              <!-- In Stock -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-slate-700"
                  >In Stock</label
                >
                <ToggleSwitch v-model="variant.in_stock" />
              </div>
            </div>

            <!-- Variant Images -->
            <div class="mt-4">
              <label class="text-sm font-medium text-slate-700 block mb-2"
                >Variant Images</label
              >
              <FileUpload
                :multiple="true"
                accept="image/*"
                :auto="false"
                :show-upload-button="false"
                @select="(e) => onVariantImageSelect(index, e)"
                @clear="clearVariantImages(index)"
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
                      :disabled="variant.images.length === 0"
                    />
                  </div>
                </template>
                <template #content>
                  <div
                    v-if="variant.images.length > 0"
                    class="flex flex-wrap gap-2 mt-2"
                  >
                    <div
                      v-for="(img, imgIdx) in variant.images"
                      :key="imgIdx"
                      class="relative"
                    >
                      <img
                        :src="img.previewUrl"
                        :alt="img.file.name"
                        class="w-20 h-20 object-cover rounded border border-slate-200"
                      />
                      <Button
                        type="button"
                        icon="pi pi-times"
                        severity="danger"
                        text
                        rounded
                        size="small"
                        class="!absolute -top-2 -right-2 !w-5 !h-5"
                        @click="removeVariantImage(index, imgIdx)"
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
          </div>
        </div>

        <Button
          type="button"
          icon="pi pi-plus"
          label="Add Variant"
          severity="secondary"
          outlined
          class="mt-4"
          @click="addVariant"
        />
      </div>

      <!-- Submit -->
      <div class="flex justify-end">
        <Button
          type="submit"
          label="Create Product"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>
