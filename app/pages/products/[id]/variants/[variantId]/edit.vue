<script setup>
import { ApiError } from "~/composables/apiClient";
import { useProductStore } from "~/stores/product";
import { useAttributeCodeStore } from "~/stores/attributeCode";
import { VARIANTS, MEDIA } from "~/constants/endpoints";
import { useConfirm } from "primevue/useconfirm";

const route = useRoute();
const productId = route.params.id;
const variantId = route.params.variantId;
const productStore = useProductStore();
const attributeCodeStore = useAttributeCodeStore();
const confirm = useConfirm();

// --- Form fields (flat structure matching API response) ---
const price = ref(null);
const salePrice = ref(null);
const saleStartsAt = ref(null);
const saleEndsAt = ref(null);

const manageStock = ref(false);
const stockQuantity = ref(0);
const inStock = ref(true);

const attributes = ref([]);
const isDefault = ref(false);
const sortOrder = ref(0);
const status = ref("active");

// --- Original values snapshot for dirty tracking ---
const originalValues = ref(null);

function takeSnapshot() {
  return {
    price: price.value,
    sale_price: salePrice.value,
    sale_starts_at: saleStartsAt.value
      ? saleStartsAt.value.toISOString().slice(0, 10)
      : null,
    sale_ends_at: saleEndsAt.value
      ? saleEndsAt.value.toISOString().slice(0, 10)
      : null,
    manage_stock: manageStock.value,
    stock_quantity: stockQuantity.value,
    in_stock: inStock.value,
    attributes: JSON.stringify(
      attributes.value.map((a) => ({ type: a.type, value: a.value })),
    ),
    is_default: isDefault.value,
    sort_order: sortOrder.value,
    status: status.value,
  };
}

function getCurrentValues() {
  return {
    price: price.value,
    sale_price: salePrice.value,
    sale_starts_at: saleStartsAt.value
      ? saleStartsAt.value.toISOString().slice(0, 10)
      : null,
    sale_ends_at: saleEndsAt.value
      ? saleEndsAt.value.toISOString().slice(0, 10)
      : null,
    manage_stock: manageStock.value,
    stock_quantity: stockQuantity.value,
    in_stock: inStock.value,
    attributes: JSON.stringify(
      attributes.value.map((a) => ({ type: a.type, value: a.value })),
    ),
    is_default: isDefault.value,
    sort_order: sortOrder.value,
    status: status.value,
  };
}

function getChangedFields() {
  const current = getCurrentValues();
  const original = originalValues.value;
  const changed = {};

  for (const key of Object.keys(current)) {
    if (current[key] !== original[key]) {
      if (key === "attributes") {
        changed.attributes = attributes.value.map((a) => ({ type: a.type, value: a.value }));
      } else {
        changed[key] = current[key];
      }
    }
  }

  return changed;
}

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// --- Images ---
const existingImages = ref([]);
const newImages = ref([]);

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

async function deleteExistingImage(imageId) {
  try {
    const api = useApiClient();
    await api.del(MEDIA.DELETE(imageId));
    existingImages.value = existingImages.value.filter((img) => img.id !== imageId);
  } catch (e) {
    serverError.value = "Failed to delete image";
  }
}

function onImageClear() {
  newImages.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  newImages.value = [];
}

onBeforeUnmount(() => {
  newImages.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
});

// --- UI state ---
const pageLoading = ref(true);
const loading = ref(false);
const serverError = ref("");
const validationErrors = ref({});
const variantSku = ref("");

// --- Attribute management ---
function addAttribute() {
  attributes.value.push({ type: "", value: "" });
}

function removeAttribute(index) {
  attributes.value.splice(index, 1);
}

function availableTypes() {
  const usedTypes = attributes.value.map((a) => a.type);
  return attributeCodeStore.types.filter((t) => !usedTypes.includes(t.value));
}

function onAttributeTypeChange(index, newType) {
  attributes.value[index].type = newType;
  attributes.value[index].value = "";
  if (newType) {
    attributeCodeStore.fetchActiveByType(newType);
  }
}

// --- Load variant data via GET /productvariants/{variant_id} ---
onMounted(async () => {
  try {
    const [response] = await Promise.all([
      productStore.fetchVariant(variantId),
      attributeCodeStore.fetchTypes(),
    ]);

    const v = response.data;
    if (!v) {
      navigateTo(`/products/${productId}`);
      return;
    }

    variantSku.value = v.sku || "";

    // Flat pricing fields
    price.value = v.price ? Number(v.price) : null;
    salePrice.value = v.sale_price ? Number(v.sale_price) : null;
    saleStartsAt.value = v.sale_starts_at ? new Date(v.sale_starts_at) : null;
    saleEndsAt.value = v.sale_ends_at ? new Date(v.sale_ends_at) : null;

    // Flat inventory fields
    manageStock.value = v.manage_stock ?? false;
    stockQuantity.value = v.stock_quantity ?? 0;
    inStock.value = v.in_stock ?? true;

    // Attributes — fetch active values for each existing type
    if (Array.isArray(v.attributes) && v.attributes.length > 0) {
      attributes.value = v.attributes.map((a) => ({
        type: a.type,
        value: a.value,
      }));
      await Promise.all(
        v.attributes.map((a) => attributeCodeStore.fetchActiveByType(a.type)),
      );
    }

    // Other fields
    isDefault.value = v.is_default ?? false;
    sortOrder.value = v.sort_order ?? 0;
    status.value = v.status || "active";
    existingImages.value = v.images || [];

    // Snapshot original values for dirty tracking
    originalValues.value = takeSnapshot();
  } finally {
    pageLoading.value = false;
  }
});

// --- Sale field cross-validation ---
function validateSaleFields() {
  const errors = {};
  const hasSale = salePrice.value != null && salePrice.value !== "";
  const hasStart = saleStartsAt.value != null;
  const hasEnd = saleEndsAt.value != null;

  if (hasSale || hasStart || hasEnd) {
    if (!hasSale || salePrice.value <= 0) {
      errors.sale_price =
        "Sale price is required and must be greater than 0";
    } else if (price.value && salePrice.value >= price.value) {
      errors.sale_price = "Sale price must be less than price";
    }
    if (!hasStart) {
      errors.sale_starts_at = "Sale start date is required";
    }
    if (!hasEnd) {
      errors.sale_ends_at = "Sale end date is required";
    }
    if (
      hasStart &&
      hasEnd &&
      new Date(saleEndsAt.value) <= new Date(saleStartsAt.value)
    ) {
      errors.sale_ends_at = "End date must be after start date";
    }
  }
  return errors;
}

// --- Form submission via PUT /productvariants/{variant_id} ---
async function onSubmit() {
  const errors = {};

  if (!price.value || price.value <= 0) {
    errors.price = "Price is required and must be greater than 0";
  }
  if (stockQuantity.value == null || stockQuantity.value < 0) {
    errors.stock_quantity = "Stock quantity must be 0 or greater";
  }

  if (attributes.value.length === 0) {
    errors.attributes = "At least one attribute is required";
  } else {
    attributes.value.forEach((attr) => {
      if (!attr.type || !attr.value) {
        errors.attributes = "All attributes must have type and value selected";
      }
    });
  }

  Object.assign(errors, validateSaleFields());

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors;
    return;
  }

  const changed = getChangedFields();
  const hasNewImages = newImages.value.length > 0;

  if (Object.keys(changed).length === 0 && !hasNewImages) {
    navigateTo(`/products/${productId}`);
    return;
  }

  validationErrors.value = {};
  loading.value = true;
  serverError.value = "";

  try {
    if (hasNewImages) {
      // Fall back to FormData when files are attached
      const formData = new FormData();
      for (const [key, val] of Object.entries(changed)) {
        if (key === "attributes") {
          val.forEach((attr, j) => {
            formData.append(`attributes[${j}][type]`, attr.type);
            formData.append(`attributes[${j}][value]`, attr.value);
          });
        } else {
          formData.append(key, val);
        }
      }
      newImages.value.forEach((img) => {
        formData.append("photos[]", img.file);
      });
      await productStore.updateVariant(variantId, formData);
    } else {
      // JSON with only changed fields
      const api = useApiClient();
      await api.put(VARIANTS.UPDATE(variantId), changed);
    }
    navigateTo(`/products/${productId}`);
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

// --- Delete variant via DELETE /productvariants/{variant_id} ---
function onDelete() {
  confirm.require({
    message:
      "Are you sure you want to delete this variant? This action cannot be undone.",
    header: "Delete Variant",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Delete",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await productStore.deleteVariant(variantId);
        navigateTo(`/products/${productId}`);
      } catch (e) {
        if (e instanceof ApiError) {
          serverError.value = e.message;
        } else {
          serverError.value = "An unexpected error occurred";
        }
      }
    },
  });
}
</script>

<template>
  <div>
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink :to="`/products/${productId}`">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Edit Variant</h1>
          <p v-if="variantSku" class="text-sm text-slate-500">
            {{ variantSku }}
          </p>
        </div>
      </div>
      <Button
        v-if="!pageLoading"
        label="Delete"
        icon="pi pi-trash"
        severity="danger"
        @click="onDelete"
      />
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else>
      <!-- Server error -->
      <Message
        v-if="serverError"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        {{ serverError }}
      </Message>

      <!-- Card 1: Attributes -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Attributes</h2>
        <div class="space-y-2">
          <div
            v-for="(attr, index) in attributes"
            :key="index"
            class="flex items-center gap-2"
          >
            <Select
              :model-value="attr.type"
              :options="
                availableTypes().concat(
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
              @update:model-value="(v) => onAttributeTypeChange(index, v)"
            />
            <Select
              v-model="attr.value"
              :options="attributeCodeStore.activeValuesByType[attr.type] || []"
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
              @click="removeAttribute(index)"
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
          :disabled="attributes.length >= attributeCodeStore.types.length"
          @click="addAttribute"
        />
        <Message
          v-if="validationErrors.attributes"
          severity="error"
          size="small"
          variant="simple"
          class="mt-2"
        >
          {{ validationErrors.attributes }}
        </Message>
      </div>

      <!-- Card 2: Pricing -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Pricing</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Price *</label>
            <InputNumber
              v-model="price"
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
              v-model="salePrice"
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
              v-model="saleStartsAt"
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
              v-model="saleEndsAt"
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

      <!-- Card 3: Inventory -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Inventory</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Manage Stock</label
            >
            <ToggleSwitch v-model="manageStock" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Stock Quantity *</label
            >
            <InputNumber v-model="stockQuantity" :min="0" fluid />
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
            <ToggleSwitch v-model="inStock" />
          </div>
        </div>
      </div>

      <!-- Card 4: Images -->
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
        <small class="text-slate-400 block mb-2"
          >Max 2 images (jpg, jpeg, png, webp; max 5MB each). New uploads will
          replace existing images.</small
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

      <!-- Card 5: Settings -->
      <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Settings</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Status</label>
            <Select
              v-model="status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              fluid
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Sort Order</label
            >
            <InputNumber v-model="sortOrder" :min="0" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700"
              >Default Variant</label
            >
            <ToggleSwitch v-model="isDefault" />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end">
        <Button
          label="Update Variant"
          icon="pi pi-check"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </div>
  </div>
</template>
