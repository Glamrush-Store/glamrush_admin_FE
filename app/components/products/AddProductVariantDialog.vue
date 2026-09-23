<script setup>
import { useAttributeCodeStore } from "~/stores/attributeCode";

const MAX_PHOTOS = 2;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serverError: {
    type: String,
    default: "",
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:visible", "submit"]);

const attributeCodeStore = useAttributeCodeStore();
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const variant = reactive({
  attributes: [],
  price: null,
  sale_price: null,
  sale_starts_at: null,
  sale_ends_at: null,
  manage_stock: false,
  stock_quantity: 0,
  in_stock: true,
  is_default: false,
  status: "active",
  sort_order: null,
});

const photos = ref([]);
const clientErrors = ref({});

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Disabled", value: "disabled" },
];

const selectedTypes = computed(() =>
  variant.attributes.map((attribute) => attribute.type).filter(Boolean),
);

function resetForm() {
  photos.value.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  photos.value = [];
  clientErrors.value = {};

  variant.attributes = [];
  variant.price = null;
  variant.sale_price = null;
  variant.sale_starts_at = null;
  variant.sale_ends_at = null;
  variant.manage_stock = false;
  variant.stock_quantity = 0;
  variant.in_stock = true;
  variant.is_default = false;
  variant.status = "active";
  variant.sort_order = null;
}

function fieldError(field) {
  const candidates = [
    field,
    field.replaceAll("_", "."),
  ];

  for (const key of candidates) {
    const clientError = clientErrors.value[key];
    if (clientError) return clientError;

    const serverError = props.errors?.[key];
    if (Array.isArray(serverError)) return serverError[0];
    if (serverError) return serverError;
  }

  return "";
}

function attributeFieldError(index, field) {
  return fieldError(`attributes.${index}.${field}`)
    || fieldError(`attributes_${index}_${field}`)
    || fieldError("attributes");
}

function photoFieldError(index) {
  return fieldError(`photos.${index}`) || fieldError(`photos_${index}`) || fieldError("photos");
}

function availableTypesForAttribute(index) {
  const currentType = variant.attributes[index]?.type;
  return attributeCodeStore.types.filter((type) => {
    return type.value === currentType || !selectedTypes.value.includes(type.value);
  });
}

async function ensureAttributeTypes() {
  if (attributeCodeStore.types.length) return;
  await attributeCodeStore.fetchTypes();
}

function addAttribute() {
  variant.attributes.push({ type: "", value: "" });
}

function removeAttribute(index) {
  variant.attributes.splice(index, 1);
}

function onAttributeTypeChange(index, value) {
  variant.attributes[index].type = value;
  variant.attributes[index].value = "";
  if (value) attributeCodeStore.fetchActiveByType(value);
}

function onPhotoSelect(event) {
  const selectedFiles = Array.from(event.files || []);
  const nextErrors = {};
  const { photos: _photos, ...remainingErrors } = clientErrors.value;
  clientErrors.value = remainingErrors;

  selectedFiles.forEach((file) => {
    if (photos.value.length >= MAX_PHOTOS) {
      nextErrors.photos = `You can upload a maximum of ${MAX_PHOTOS} photos.`;
      return;
    }

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      nextErrors.photos = "Photos must be JPEG, PNG, or WebP.";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      nextErrors.photos = "Each photo must be 5 MB or smaller.";
      return;
    }

    const alreadyAdded = photos.value.some(
      (photo) => photo.file.name === file.name && photo.file.size === file.size,
    );

    if (!alreadyAdded) {
      photos.value.push({ file, previewUrl: URL.createObjectURL(file) });
    }
  });

  clientErrors.value = { ...clientErrors.value, ...nextErrors };
}

function removePhoto(index) {
  URL.revokeObjectURL(photos.value[index].previewUrl);
  photos.value.splice(index, 1);
  if (photos.value.length <= MAX_PHOTOS) {
    const { photos: _photos, ...remainingErrors } = clientErrors.value;
    clientErrors.value = remainingErrors;
  }
}

function clearPhotos() {
  photos.value.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  photos.value = [];
}

function validateForm() {
  const errors = {};

  if (!variant.attributes.length) {
    errors.attributes = "At least one attribute is required.";
  }

  const seenTypes = new Set();
  variant.attributes.forEach((attribute, index) => {
    if (!attribute.type || !attribute.value) {
      errors.attributes = "All attributes must have a type and value.";
    }

    if (attribute.type && seenTypes.has(attribute.type)) {
      errors.attributes = "Attribute types cannot be duplicated.";
      errors[`attributes.${index}.type`] = "This attribute type is already selected.";
    }

    if (attribute.type) seenTypes.add(attribute.type);
  });

  if (variant.price == null || variant.price === "" || Number(variant.price) < 0) {
    errors.price = "Price is required and must be zero or greater.";
  }

  if (variant.sale_price != null && variant.sale_price !== "" && Number(variant.sale_price) < 0) {
    errors.sale_price = "Sale price must be zero or greater.";
  }

  if (variant.stock_quantity == null || !Number.isInteger(Number(variant.stock_quantity)) || Number(variant.stock_quantity) < 0) {
    errors.stock_quantity = "Stock quantity must be a non-negative integer.";
  }

  if (
    variant.sale_starts_at &&
    variant.sale_ends_at &&
    new Date(variant.sale_ends_at) <= new Date(variant.sale_starts_at)
  ) {
    errors.sale_ends_at = "Sale end date must be after the sale start date.";
  }

  if (photos.value.length > MAX_PHOTOS) {
    errors.photos = `You can upload a maximum of ${MAX_PHOTOS} photos.`;
  }

  photos.value.forEach((photo, index) => {
    if (!ACCEPTED_PHOTO_TYPES.includes(photo.file.type)) {
      errors[`photos.${index}`] = "Photo must be JPEG, PNG, or WebP.";
    }

    if (photo.file.size > MAX_PHOTO_SIZE) {
      errors[`photos.${index}`] = "Photo must be 5 MB or smaller.";
    }
  });

  clientErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function onSubmit() {
  if (props.loading) return;
  if (!validateForm()) return;

  emit("submit", {
    ...toRaw(variant),
    attributes: variant.attributes.map((attribute) => ({ ...attribute })),
    photos: photos.value.map((photo) => photo.file),
  });
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await ensureAttributeTypes();
      if (!variant.attributes.length) addAttribute();
      return;
    }

    if (!props.loading) resetForm();
  },
);

watch(
  () => props.loading,
  (loading) => {
    if (!props.visible && !loading) resetForm();
  },
);

onBeforeUnmount(() => {
  photos.value.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
});
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Add Variant"
    modal
    dismissable-mask
    :style="{ width: '52rem', maxWidth: 'calc(100vw - 2rem)' }"
  >
    <div aria-live="polite">
      <Message
        v-if="serverError"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        {{ serverError }}
      </Message>
    </div>

    <form class="space-y-5" @submit.prevent="onSubmit">
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 class="m-0 text-base font-semibold text-slate-900">Attributes</h3>
            <p class="m-0 mt-1 text-sm text-slate-500">Choose configured SKU attribute values for this variant.</p>
          </div>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Add attribute"
            severity="secondary"
            outlined
            size="small"
            :disabled="variant.attributes.length >= attributeCodeStore.types.length"
            @click="addAttribute"
          />
        </div>

        <div class="space-y-2">
          <div
            v-for="(attribute, index) in variant.attributes"
            :key="index"
            class="grid grid-cols-1 gap-2 rounded border border-slate-100 p-3 md:grid-cols-[minmax(10rem,14rem)_1fr_auto]"
          >
            <div class="flex flex-col gap-1">
              <label :for="`variant-attribute-type-${index}`" class="text-sm font-medium text-slate-700">Type</label>
              <Select
                :id="`variant-attribute-type-${index}`"
                :model-value="attribute.type"
                :options="availableTypesForAttribute(index)"
                option-label="label"
                option-value="value"
                placeholder="Select type"
                filter
                fluid
                @update:model-value="(value) => onAttributeTypeChange(index, value)"
              />
              <Message
                v-if="attributeFieldError(index, 'type')"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ attributeFieldError(index, "type") }}
              </Message>
            </div>

            <div class="flex flex-col gap-1">
              <label :for="`variant-attribute-value-${index}`" class="text-sm font-medium text-slate-700">Value</label>
              <Select
                :id="`variant-attribute-value-${index}`"
                v-model="attribute.value"
                :options="attributeCodeStore.activeValuesByType[attribute.type] || []"
                option-label="value"
                option-value="value"
                placeholder="Select value"
                filter
                fluid
                :disabled="!attribute.type"
              />
              <Message
                v-if="attributeFieldError(index, 'value')"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ attributeFieldError(index, "value") }}
              </Message>
            </div>

            <div class="flex items-end">
              <Button
                type="button"
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                aria-label="Remove attribute"
                @click="removeAttribute(index)"
              />
            </div>
          </div>
        </div>

        <Message
          v-if="fieldError('attributes')"
          severity="error"
          size="small"
          variant="simple"
          class="mt-2"
        >
          {{ fieldError("attributes") }}
        </Message>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="m-0 mb-3 text-base font-semibold text-slate-900">Pricing</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label for="variant-price" class="text-sm font-medium text-slate-700">Price *</label>
            <InputNumber id="variant-price" v-model="variant.price" mode="currency" currency="NGN" :min="0" fluid />
            <Message v-if="fieldError('price')" severity="error" size="small" variant="simple">
              {{ fieldError("price") }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="variant-sale-price" class="text-sm font-medium text-slate-700">Sale Price</label>
            <InputNumber id="variant-sale-price" v-model="variant.sale_price" mode="currency" currency="NGN" :min="0" fluid />
            <Message v-if="fieldError('sale_price')" severity="error" size="small" variant="simple">
              {{ fieldError("sale_price") }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="variant-sale-start" class="text-sm font-medium text-slate-700">Sale Starts At</label>
            <DatePicker id="variant-sale-start" v-model="variant.sale_starts_at" show-time placeholder="Select date" fluid />
            <Message v-if="fieldError('sale_starts_at')" severity="error" size="small" variant="simple">
              {{ fieldError("sale_starts_at") }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="variant-sale-end" class="text-sm font-medium text-slate-700">Sale Ends At</label>
            <DatePicker id="variant-sale-end" v-model="variant.sale_ends_at" show-time placeholder="Select date" fluid />
            <Message v-if="fieldError('sale_ends_at')" severity="error" size="small" variant="simple">
              {{ fieldError("sale_ends_at") }}
            </Message>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="m-0 mb-3 text-base font-semibold text-slate-900">Inventory & Settings</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="flex flex-col gap-2">
            <label for="variant-manage-stock" class="text-sm font-medium text-slate-700">Manage Stock</label>
            <ToggleSwitch input-id="variant-manage-stock" v-model="variant.manage_stock" />
          </div>

          <div class="flex flex-col gap-1">
            <label for="variant-stock-quantity" class="text-sm font-medium text-slate-700">Stock Quantity *</label>
            <InputNumber id="variant-stock-quantity" v-model="variant.stock_quantity" :min="0" fluid />
            <Message v-if="fieldError('stock_quantity')" severity="error" size="small" variant="simple">
              {{ fieldError("stock_quantity") }}
            </Message>
          </div>

          <div class="flex flex-col gap-2">
            <label for="variant-in-stock" class="text-sm font-medium text-slate-700">In Stock</label>
            <ToggleSwitch input-id="variant-in-stock" v-model="variant.in_stock" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="variant-default" class="text-sm font-medium text-slate-700">Default Variant</label>
            <ToggleSwitch input-id="variant-default" v-model="variant.is_default" />
          </div>

          <div class="flex flex-col gap-1">
            <label for="variant-status" class="text-sm font-medium text-slate-700">Status</label>
            <Select id="variant-status" v-model="variant.status" :options="statusOptions" option-label="label" option-value="value" fluid />
            <Message v-if="fieldError('status')" severity="error" size="small" variant="simple">
              {{ fieldError("status") }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="variant-sort-order" class="text-sm font-medium text-slate-700">Sort Order</label>
            <InputNumber id="variant-sort-order" v-model="variant.sort_order" :min="0" fluid />
            <Message v-if="fieldError('sort_order')" severity="error" size="small" variant="simple">
              {{ fieldError("sort_order") }}
            </Message>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="m-0 text-base font-semibold text-slate-900">Photos</h3>
        <p class="m-0 mb-3 mt-1 text-sm text-slate-500">Optional. Upload up to 2 JPEG, PNG, or WebP images, 5 MB each.</p>

        <FileUpload
          :multiple="true"
          accept="image/jpeg,image/png,image/webp"
          :auto="false"
          :show-upload-button="false"
          @select="onPhotoSelect"
          @clear="clearPhotos"
        >
          <template #header="{ chooseCallback, clearCallback }">
            <div class="flex flex-wrap items-center gap-2">
              <Button type="button" icon="pi pi-images" label="Choose" size="small" outlined severity="secondary" @click="chooseCallback" />
              <Button type="button" icon="pi pi-times" label="Clear" size="small" outlined severity="danger" :disabled="photos.length === 0" @click="clearCallback" />
            </div>
          </template>
          <template #content>
            <div v-if="photos.length > 0" class="mt-3 flex flex-wrap gap-4">
              <div v-for="(photo, index) in photos" :key="`${photo.file.name}-${photo.file.size}`" class="relative">
                <img :src="photo.previewUrl" :alt="photo.file.name" class="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
                <Button type="button" icon="pi pi-times" severity="danger" text rounded size="small" class="!absolute -right-2 -top-2" aria-label="Remove photo" @click="removePhoto(index)" />
                <span class="mt-1 block max-w-24 truncate text-xs text-slate-500">{{ photo.file.name }}</span>
                <Message v-if="photoFieldError(index)" severity="error" size="small" variant="simple">
                  {{ photoFieldError(index) }}
                </Message>
              </div>
            </div>
            <div v-else class="flex items-center gap-2 py-4 text-sm text-slate-400">
              <i class="pi pi-cloud-upload" />
              <span>Choose or drag photos here</span>
            </div>
          </template>
        </FileUpload>

        <Message v-if="fieldError('photos')" severity="error" size="small" variant="simple" class="mt-2">
          {{ fieldError("photos") }}
        </Message>
      </section>

      <div class="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" label="Cancel" severity="secondary" text :disabled="loading" @click="dialogVisible = false" />
        <Button type="submit" label="Create Variant" icon="pi pi-plus" :loading="loading" :disabled="loading" />
      </div>
    </form>
  </Dialog>
</template>
