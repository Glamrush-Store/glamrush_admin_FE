<script setup>
const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({}),
  },
  categories: {
    type: Array,
    default: () => [],
  },
  storefronts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serverError: {
    type: String,
    default: "",
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
  submitLabel: {
    type: String,
    default: "Save FAQ",
  },
});

const emit = defineEmits(["submit"]);

const faqCategoryId = ref("");
const question = ref("");
const answer = ref("<p></p>");
const displayOrder = ref(0);
const isPublished = ref(false);
const publishedAt = ref(null);
const expiresAt = ref(null);
const appliesToAllStorefronts = ref(true);
const storefrontIds = ref([]);
const localError = ref("");
const previewVisible = ref(false);
const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
const activeCategories = computed(() => props.categories.filter((category) => category.is_active));

watch(
  () => props.initialValues,
  (initial) => {
    faqCategoryId.value = initial.faq_category_id || initial.category?.id || "";
    question.value = initial.question || "";
    answer.value = initial.answer || "<p></p>";
    displayOrder.value = initial.display_order ?? 0;
    isPublished.value = initial.is_published ?? false;
    publishedAt.value = initial.published_at ? new Date(initial.published_at) : null;
    expiresAt.value = initial.expires_at ? new Date(initial.expires_at) : null;
    appliesToAllStorefronts.value = initial.applies_to_all_storefronts ?? true;
    storefrontIds.value = (initial.storefronts || []).map((storefront) => storefront.id);
  },
  { immediate: true },
);

watch(appliesToAllStorefronts, (global) => {
  if (global) storefrontIds.value = [];
});

function fieldError(name) {
  return props.fieldErrors?.[name]?.[0] || "";
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function validate() {
  localError.value = "";
  if (!faqCategoryId.value || !question.value || !answer.value) {
    localError.value = "Category, question, and answer are required.";
    return false;
  }
  if (!appliesToAllStorefronts.value && storefrontIds.value.length === 0) {
    localError.value = "Select at least one storefront or choose all storefronts.";
    return false;
  }
  if (publishedAt.value && expiresAt.value && new Date(expiresAt.value) <= new Date(publishedAt.value)) {
    localError.value = "Expiration time must be later than publication time.";
    return false;
  }
  return true;
}

function onSubmit() {
  if (!validate()) return;
  emit("submit", {
    faq_category_id: faqCategoryId.value,
    question: question.value,
    answer: answer.value,
    display_order: displayOrder.value || 0,
    is_published: isPublished.value,
    published_at: toIso(publishedAt.value),
    expires_at: toIso(expiresAt.value),
    applies_to_all_storefronts: appliesToAllStorefronts.value,
    storefront_ids: appliesToAllStorefronts.value ? [] : storefrontIds.value,
  });
}
</script>

<template>
  <div>
    <Message v-if="serverError || localError" severity="error" :closable="false" class="mb-4">
      {{ serverError || localError }}
    </Message>

    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-6">
      <div class="grid grid-cols-1 gap-6">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">FAQ Content</h2>
          <div class="grid grid-cols-1 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Active Category *</label>
              <Select v-model="faqCategoryId" :options="activeCategories" option-label="name" option-value="id" placeholder="Select category" fluid />
              <small class="text-slate-500">Only active categories with currently published FAQs appear publicly.</small>
              <Message v-if="fieldError('faq_category_id')" severity="error" size="small" variant="simple">{{ fieldError("faq_category_id") }}</Message>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Question *</label>
              <InputText v-model="question" fluid />
              <Message v-if="fieldError('question')" severity="error" size="small" variant="simple">{{ fieldError("question") }}</Message>
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between gap-3">
                <label class="text-sm font-medium text-slate-700">Answer *</label>
                <Button type="button" label="Preview" icon="pi pi-eye" severity="secondary" outlined @click="previewVisible = true" />
              </div>
              <ContentManagementHtmlEditor v-model="answer" />
              <Message v-if="fieldError('answer')" severity="error" size="small" variant="simple">{{ fieldError("answer") }}</Message>
            </div>
          </div>
        </div>
      </div>

      <aside class="xl:sticky xl:top-6 self-start grid grid-cols-1 gap-6">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Publication</h2>
          <div class="grid grid-cols-1 gap-4">
            <div class="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <span class="text-sm font-medium text-slate-700">Published flag</span>
              <ToggleSwitch v-model="isPublished" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Published At</label>
              <DatePicker v-model="publishedAt" show-time hour-format="24" date-format="yy-mm-dd" fluid />
              <small class="text-slate-500">Timezone: {{ timezoneLabel }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Expires At</label>
              <DatePicker v-model="expiresAt" show-time hour-format="24" date-format="yy-mm-dd" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Display Order</label>
              <InputNumber v-model="displayOrder" :min="0" :use-grouping="false" fluid />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Storefront Availability</h2>
          <div class="grid grid-cols-1 gap-4">
            <div class="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <span class="text-sm font-medium text-slate-700">All storefronts</span>
              <ToggleSwitch v-model="appliesToAllStorefronts" />
            </div>
            <MultiSelect
              v-if="!appliesToAllStorefronts"
              v-model="storefrontIds"
              :options="storefronts"
              option-label="name"
              option-value="id"
              display="chip"
              placeholder="Select storefronts"
              fluid
            />
          </div>
        </div>

        <div class="flex gap-2">
          <Button type="button" label="Preview" icon="pi pi-eye" severity="secondary" outlined class="flex-1" @click="previewVisible = true" />
          <Button type="button" :label="submitLabel" icon="pi pi-check" :loading="loading" class="flex-1" @click="onSubmit" />
        </div>
      </aside>
    </div>

    <ContentManagementPreviewDialog
      v-model:visible="previewVisible"
      :title="question"
      :html="answer"
    />
  </div>
</template>
