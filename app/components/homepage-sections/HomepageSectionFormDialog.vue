<script setup>
import {
  HOMEPAGE_SECTION_DIRECTION_OPTIONS,
  HOMEPAGE_SECTION_SORT_OPTIONS,
} from "~/constants/homepageSections";

const props = defineProps({
  visible: { type: Boolean, default: false },
  section: { type: Object, default: null },
  sectionTypes: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  collections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  selectorLoading: { type: Boolean, default: false },
  typeLoading: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  serverError: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "submit"]);

const form = reactive({
  type: "",
  title: "",
  subtitle: "",
  config: {},
  display_order: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
});
const localError = shallowRef("");

const isEditing = computed(() => Boolean(props.section?.id));
const selectedType = computed(() => props.sectionTypes.find((type) => type.value === form.type) || null);
const configKeys = computed(() => selectedType.value?.config_keys || []);

const productOptions = computed(() => props.products.map((product) => ({
  id: product.id,
  label: product.sku ? `${product.name} (${product.sku})` : product.name,
})));

const categoryOptions = computed(() => props.categories
  .filter((category) => category.slug)
  .map((category) => ({
    slug: category.slug,
    label: category.parent_name ? `${category.parent_name} / ${category.name}` : category.name,
  })));

const collectionOptions = computed(() => props.collections
  .filter((collection) => collection.slug)
  .map((collection) => ({
    slug: collection.slug,
    label: collection.name || collection.title || collection.slug,
  })));

function hasConfigKey(key) {
  return configKeys.value.includes(key);
}

function defaultTypeValue() {
  return props.sectionTypes[0]?.value || "";
}

function defaultConfigValue(key, current = {}) {
  if (key === "limit") return Number(current.limit || 8);
  if (key === "sort") return current.sort || "created_at";
  if (key === "direction") return current.direction || "desc";
  if (key === "require_products") return Boolean(current.require_products);
  if (key === "product_ids") return Array.isArray(current.product_ids) ? current.product_ids : [];
  if (key === "category_slug") return current.category_slug || null;
  if (key === "collection_slug") return current.collection_slug || null;
  return current[key] ?? null;
}

function normalizeConfig(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
}

function pruneConfigForType(current = {}) {
  const normalized = normalizeConfig(current);
  return Object.fromEntries(
    configKeys.value.map((key) => [key, defaultConfigValue(key, normalized)]),
  );
}

function dateForPicker(value) {
  return value ? new Date(value) : null;
}

function resetForm() {
  const section = props.section || {};
  form.type = section.type || defaultTypeValue();
  form.title = section.title || "";
  form.subtitle = section.subtitle || "";
  form.display_order = Number(section.display_order ?? section.sort_order ?? 0);
  form.is_active = section.is_active ?? true;
  form.starts_at = dateForPicker(section.starts_at);
  form.ends_at = dateForPicker(section.ends_at);
  form.config = pruneConfigForType(section.config || {});
  localError.value = "";
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) resetForm();
  },
);

watch(
  () => props.section,
  () => {
    if (props.visible) resetForm();
  },
);

watch(
  () => props.sectionTypes,
  () => {
    if (!props.visible) return;
    if (!form.type) {
      resetForm();
      return;
    }
    const existingConfig = props.section?.type === form.type
      ? props.section.config || form.config
      : form.config;
    form.config = pruneConfigForType(existingConfig);
  },
);

watch(
  () => form.type,
  (_type, previousType) => {
    if (!props.visible || !previousType) return;
    form.config = pruneConfigForType(form.config);
  },
);

function close() {
  if (!props.loading) emit("update:visible", false);
}

function fieldError(field) {
  const error = props.errors?.[field];
  return Array.isArray(error) ? error[0] : error;
}

function configError(field) {
  return fieldError(`config.${field}`) || fieldError(`config.${field}.0`) || fieldError(field);
}

function nullableText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function dateForApi(value) {
  return value ? new Date(value).toISOString() : null;
}

function normalizedConfig() {
  const config = {};

  configKeys.value.forEach((key) => {
    const value = form.config[key];

    if (key === "limit") {
      config.limit = Math.min(50, Math.max(1, Number(value || 1)));
      return;
    }

    if (key === "require_products") {
      config.require_products = Boolean(value);
      return;
    }

    if (key === "product_ids") {
      config.product_ids = Array.isArray(value) ? value : [];
      return;
    }

    if (key === "category_slug" || key === "collection_slug") {
      config[key] = value || null;
      return;
    }

    config[key] = value;
  });

  return config;
}

function submit() {
  localError.value = "";

  if (!form.type || !form.title.trim()) {
    localError.value = "Section type and title are required.";
    return;
  }

  const config = normalizedConfig();
  if (hasConfigKey("category_slug") && !config.category_slug) {
    localError.value = "Select a category for this section type.";
    return;
  }
  if (hasConfigKey("collection_slug") && !config.collection_slug) {
    localError.value = "Select a collection for this section type.";
    return;
  }
  if (hasConfigKey("product_ids") && !config.product_ids.length) {
    localError.value = "Select at least one product for this section type.";
    return;
  }

  emit("submit", {
    type: form.type,
    title: form.title.trim(),
    subtitle: nullableText(form.subtitle),
    config,
    display_order: Number(form.display_order || 0),
    is_active: Boolean(form.is_active),
    starts_at: dateForApi(form.starts_at),
    ends_at: dateForApi(form.ends_at),
  });
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="isEditing ? 'Edit homepage section' : 'Create homepage section'"
    class="w-[min(96vw,54rem)]"
    :closable="!loading"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <Message v-if="localError || serverError" severity="error" :closable="false">
        {{ localError || serverError }}
      </Message>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Section type</label>
          <Select
            v-model="form.type"
            :options="sectionTypes"
            option-label="label"
            option-value="value"
            placeholder="Select section type"
            :loading="typeLoading"
            :disabled="loading || typeLoading"
          />
          <small v-if="fieldError('type')" class="text-red-500">{{ fieldError("type") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Display order</label>
          <InputNumber v-model="form.display_order" :min="0" show-buttons :disabled="loading" />
          <small v-if="fieldError('display_order')" class="text-red-500">{{ fieldError("display_order") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Title</label>
          <InputText v-model="form.title" placeholder="Selected for you" :disabled="loading" />
          <small v-if="fieldError('title')" class="text-red-500">{{ fieldError("title") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Subtitle</label>
          <InputText v-model="form.subtitle" placeholder="Optional subtitle" :disabled="loading" />
          <small v-if="fieldError('subtitle')" class="text-red-500">{{ fieldError("subtitle") }}</small>
        </div>

        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 class="m-0 text-sm font-semibold text-slate-900">Section config</h3>
              <p class="m-0 mt-1 text-xs text-slate-500">
                Fields shown here come from the selected backend section type.
              </p>
            </div>
            <Tag v-if="selectedType" :value="selectedType.value" severity="secondary" />
          </div>

          <div v-if="!selectedType" class="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            Select a section type to configure it.
          </div>

          <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div v-if="hasConfigKey('limit')" class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Limit</label>
              <InputNumber v-model="form.config.limit" :min="1" :max="50" show-buttons :disabled="loading" />
              <small v-if="configError('limit')" class="text-red-500">{{ configError("limit") }}</small>
            </div>

            <div v-if="hasConfigKey('sort')" class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Sort</label>
              <Select
                v-model="form.config.sort"
                :options="HOMEPAGE_SECTION_SORT_OPTIONS"
                option-label="label"
                option-value="value"
                :disabled="loading"
              />
              <small v-if="configError('sort')" class="text-red-500">{{ configError("sort") }}</small>
            </div>

            <div v-if="hasConfigKey('direction')" class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Direction</label>
              <Select
                v-model="form.config.direction"
                :options="HOMEPAGE_SECTION_DIRECTION_OPTIONS"
                option-label="label"
                option-value="value"
                :disabled="loading"
              />
              <small v-if="configError('direction')" class="text-red-500">{{ configError("direction") }}</small>
            </div>

            <div v-if="hasConfigKey('category_slug')" class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Category</label>
              <Select
                v-model="form.config.category_slug"
                :options="categoryOptions"
                option-label="label"
                option-value="slug"
                filter
                placeholder="Select category"
                :loading="selectorLoading"
                :disabled="loading || selectorLoading"
              />
              <small v-if="configError('category_slug')" class="text-red-500">{{ configError("category_slug") }}</small>
            </div>

            <div v-if="hasConfigKey('collection_slug')" class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Collection</label>
              <Select
                v-model="form.config.collection_slug"
                :options="collectionOptions"
                option-label="label"
                option-value="slug"
                filter
                placeholder="Select collection"
                :loading="selectorLoading"
                :disabled="loading || selectorLoading"
              />
              <small v-if="configError('collection_slug')" class="text-red-500">{{ configError("collection_slug") }}</small>
            </div>

            <div v-if="hasConfigKey('product_ids')" class="flex flex-col gap-1 md:col-span-2">
              <label class="text-sm font-medium text-slate-700">Products</label>
              <MultiSelect
                v-model="form.config.product_ids"
                :options="productOptions"
                option-label="label"
                option-value="id"
                display="chip"
                filter
                placeholder="Select products"
                :loading="selectorLoading"
                :disabled="loading || selectorLoading"
                class="w-full"
              />
              <small v-if="configError('product_ids')" class="text-red-500">{{ configError("product_ids") }}</small>
            </div>

            <div v-if="hasConfigKey('require_products')" class="flex items-end">
              <label class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                <ToggleSwitch v-model="form.config.require_products" :disabled="loading" />
                Require products
              </label>
              <small v-if="configError('require_products')" class="text-red-500">{{ configError("require_products") }}</small>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Starts at</label>
          <DatePicker v-model="form.starts_at" show-time hour-format="24" show-icon :disabled="loading" />
          <small v-if="fieldError('starts_at')" class="text-red-500">{{ fieldError("starts_at") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Ends at</label>
          <DatePicker v-model="form.ends_at" show-time hour-format="24" show-icon :disabled="loading" />
          <small v-if="fieldError('ends_at')" class="text-red-500">{{ fieldError("ends_at") }}</small>
        </div>

        <div class="flex items-end">
          <label class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <ToggleSwitch v-model="form.is_active" :disabled="loading" />
            Active
          </label>
          <small v-if="fieldError('is_active')" class="text-red-500">{{ fieldError("is_active") }}</small>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button label="Cancel" severity="secondary" outlined :disabled="loading" @click="close" />
        <Button
          :label="isEditing ? 'Save changes' : 'Create section'"
          icon="pi pi-save"
          :loading="loading"
          :disabled="loading || typeLoading || !sectionTypes.length"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>
