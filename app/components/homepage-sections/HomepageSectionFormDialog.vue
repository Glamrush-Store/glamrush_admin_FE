<script setup>
import {
  HOMEPAGE_SECTION_TYPES,
} from "~/constants/homepageSections";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  section: {
    type: Object,
    default: null,
  },
  products: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  selectorLoading: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  serverError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:visible", "submit"]);

const form = reactive({
  name: "",
  type: "product_grid",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_url: "",
  image_url: "",
  product_ids: [],
  category_ids: [],
  metadata: "{\n  \"layout\": \"carousel\"\n}",
  sort_order: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
});
const localError = shallowRef("");

const isEditing = computed(() => Boolean(props.section?.id));

const productOptions = computed(() => props.products.map((product) => ({
  id: product.id,
  label: product.sku ? `${product.name} (${product.sku})` : product.name,
})));

const categoryOptions = computed(() => props.categories.map((category) => ({
  id: category.id,
  label: category.parent_name ? `${category.parent_name} / ${category.name}` : category.name,
})));

function idsFromRelation(section, idsKey, relationKey) {
  if (Array.isArray(section?.[idsKey])) return section[idsKey];
  if (Array.isArray(section?.[relationKey])) {
    return section[relationKey].map((item) => item.id).filter(Boolean);
  }
  return [];
}

function dateForPicker(value) {
  return value ? new Date(value) : null;
}

function metadataForEditor(value) {
  if (!value) return "{\n  \"layout\": \"carousel\"\n}";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function resetForm() {
  const section = props.section || {};
  form.name = section.name || "";
  form.type = section.type || "product_grid";
  form.title = section.title || "";
  form.subtitle = section.subtitle || "";
  form.cta_label = section.cta_label || "";
  form.cta_url = section.cta_url || "";
  form.image_url = section.image_url || "";
  form.product_ids = idsFromRelation(section, "product_ids", "products");
  form.category_ids = idsFromRelation(section, "category_ids", "categories");
  form.metadata = metadataForEditor(section.metadata);
  form.sort_order = Number(section.sort_order || 0);
  form.is_active = section.is_active ?? true;
  form.starts_at = dateForPicker(section.starts_at);
  form.ends_at = dateForPicker(section.ends_at);
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

function close() {
  if (!props.loading) emit("update:visible", false);
}

function fieldError(field) {
  const error = props.errors?.[field];
  return Array.isArray(error) ? error[0] : error;
}

function nullableText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function dateForApi(value) {
  return value ? new Date(value).toISOString() : null;
}

function submit() {
  localError.value = "";

  if (!form.name.trim() || !form.type || !form.title.trim()) {
    localError.value = "Name, type, and title are required.";
    return;
  }

  let metadata = {};
  try {
    metadata = form.metadata?.trim() ? JSON.parse(form.metadata) : {};
  } catch {
    localError.value = "Metadata must be valid JSON.";
    return;
  }

  emit("submit", {
    name: form.name.trim(),
    type: form.type,
    title: form.title.trim(),
    subtitle: nullableText(form.subtitle),
    cta_label: nullableText(form.cta_label),
    cta_url: nullableText(form.cta_url),
    image_url: nullableText(form.image_url),
    product_ids: form.product_ids,
    category_ids: form.category_ids,
    metadata,
    sort_order: Number(form.sort_order || 0),
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
    class="w-[min(96vw,58rem)]"
    :closable="!loading"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <Message v-if="localError || serverError" severity="error" :closable="false">
        {{ localError || serverError }}
      </Message>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Name</label>
          <InputText v-model="form.name" placeholder="Luxury picks" :disabled="loading" />
          <small v-if="fieldError('name')" class="text-red-500">{{ fieldError("name") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Type</label>
          <Select
            v-model="form.type"
            :options="HOMEPAGE_SECTION_TYPES"
            option-label="label"
            option-value="value"
            :disabled="loading"
          />
          <small v-if="fieldError('type')" class="text-red-500">{{ fieldError("type") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Title</label>
          <InputText v-model="form.title" placeholder="Luxury picks" :disabled="loading" />
          <small v-if="fieldError('title')" class="text-red-500">{{ fieldError("title") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Subtitle</label>
          <InputText v-model="form.subtitle" placeholder="A polished edit for the week." :disabled="loading" />
          <small v-if="fieldError('subtitle')" class="text-red-500">{{ fieldError("subtitle") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">CTA label</label>
          <InputText v-model="form.cta_label" placeholder="Shop now" :disabled="loading" />
          <small v-if="fieldError('cta_label')" class="text-red-500">{{ fieldError("cta_label") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">CTA URL</label>
          <InputText v-model="form.cta_url" placeholder="/collections/luxury" :disabled="loading" />
          <small v-if="fieldError('cta_url')" class="text-red-500">{{ fieldError("cta_url") }}</small>
        </div>

        <div class="flex flex-col gap-1 md:col-span-2">
          <label class="text-sm font-medium text-slate-700">Image URL</label>
          <InputText v-model="form.image_url" placeholder="https://example.com/luxury.jpg" :disabled="loading" />
          <small v-if="fieldError('image_url')" class="text-red-500">{{ fieldError("image_url") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Products</label>
          <MultiSelect
            v-model="form.product_ids"
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
          <small v-if="fieldError('product_ids')" class="text-red-500">{{ fieldError("product_ids") }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Categories</label>
          <MultiSelect
            v-model="form.category_ids"
            :options="categoryOptions"
            option-label="label"
            option-value="id"
            display="chip"
            filter
            placeholder="Select categories"
            :loading="selectorLoading"
            :disabled="loading || selectorLoading"
            class="w-full"
          />
          <small v-if="fieldError('category_ids')" class="text-red-500">{{ fieldError("category_ids") }}</small>
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

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Sort order</label>
          <InputNumber v-model="form.sort_order" :min="0" show-buttons :disabled="loading" />
          <small v-if="fieldError('sort_order')" class="text-red-500">{{ fieldError("sort_order") }}</small>
        </div>

        <div class="flex items-end">
          <label class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <ToggleSwitch v-model="form.is_active" :disabled="loading" />
            Active
          </label>
          <small v-if="fieldError('is_active')" class="text-red-500">{{ fieldError("is_active") }}</small>
        </div>

        <div class="flex flex-col gap-1 md:col-span-2">
          <label class="text-sm font-medium text-slate-700">Metadata JSON</label>
          <Textarea
            v-model="form.metadata"
            rows="7"
            auto-resize
            class="font-mono text-sm"
            placeholder="{ &quot;layout&quot;: &quot;carousel&quot; }"
            :disabled="loading"
          />
          <small v-if="fieldError('metadata')" class="text-red-500">{{ fieldError("metadata") }}</small>
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
          :disabled="loading"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>
