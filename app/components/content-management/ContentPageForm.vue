<script setup>
import { ApiError } from "~/composables/apiClient";
import { CONTENT_PAGE_TYPE_OPTIONS, SOCIAL_PLATFORM_OPTIONS } from "~/constants/contentManagement";
import { slugifyContentValue } from "~/utils/contentPreview";

const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({}),
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
    default: "Save Page",
  },
});

const emit = defineEmits(["submit"]);

const title = ref("");
const navigationTitle = ref("");
const slug = ref("");
const slugManuallyEdited = ref(false);
const excerpt = ref("");
const content = ref("<p></p>");
const pageType = ref("custom");
const metaTitle = ref("");
const metaDescription = ref("");
const isPublished = ref(false);
const publishedAt = ref(null);
const expiresAt = ref(null);
const appliesToAllStorefronts = ref(true);
const storefrontIds = ref([]);
const displayOrder = ref(0);
const localError = ref("");
const previewVisible = ref(false);
const settings = reactive({
  email: "",
  phone: "",
  whatsapp: "",
  business_hours: "",
  address: "",
  map_url: "",
  social_links: [],
});

const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
const isContactPage = computed(() => pageType.value === "contact");
const normalizedSlug = computed(() => slugifyContentValue(slug.value));
const metaTitleLength = computed(() => metaTitle.value.length);
const metaDescriptionLength = computed(() => metaDescription.value.length);

watch(
  () => props.initialValues,
  (initial) => {
    title.value = initial.title || "";
    navigationTitle.value = initial.navigation_title || "";
    slug.value = initial.slug || "";
    slugManuallyEdited.value = !!initial.slug;
    excerpt.value = initial.excerpt || "";
    content.value = initial.content || "<p></p>";
    pageType.value = initial.page_type || "custom";
    metaTitle.value = initial.meta_title || "";
    metaDescription.value = initial.meta_description || "";
    isPublished.value = initial.is_published ?? false;
    publishedAt.value = initial.published_at ? new Date(initial.published_at) : null;
    expiresAt.value = initial.expires_at ? new Date(initial.expires_at) : null;
    appliesToAllStorefronts.value = initial.applies_to_all_storefronts ?? true;
    storefrontIds.value = (initial.storefronts || []).map((storefront) => storefront.id);
    displayOrder.value = initial.display_order ?? 0;
    Object.assign(settings, {
      email: initial.settings?.email || "",
      phone: initial.settings?.phone || "",
      whatsapp: initial.settings?.whatsapp || "",
      business_hours: initial.settings?.business_hours || "",
      address: initial.settings?.address || "",
      map_url: initial.settings?.map_url || "",
      social_links: (initial.settings?.social_links || []).map((link) => ({ ...link })),
    });
  },
  { immediate: true },
);

watch(title, (value) => {
  if (!slugManuallyEdited.value) slug.value = slugifyContentValue(value);
});

watch(appliesToAllStorefronts, (global) => {
  if (global) storefrontIds.value = [];
});

function fieldError(name) {
  return props.fieldErrors?.[name]?.[0] || "";
}

function onSlugInput(value) {
  slugManuallyEdited.value = true;
  slug.value = slugifyContentValue(value);
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function addSocialLink() {
  const used = settings.social_links.map((link) => link.platform);
  const next = SOCIAL_PLATFORM_OPTIONS.find((option) => !used.includes(option.value));
  if (next) settings.social_links.push({ platform: next.value, url: "" });
}

function removeSocialLink(index) {
  settings.social_links.splice(index, 1);
}

function buildSettings() {
  if (!isContactPage.value) return null;
  return {
    email: settings.email || null,
    phone: settings.phone || null,
    whatsapp: settings.whatsapp || null,
    business_hours: settings.business_hours || null,
    address: settings.address || null,
    map_url: settings.map_url || null,
    social_links: settings.social_links.filter((link) => link.platform && link.url),
  };
}

function validate() {
  localError.value = "";
  if (!title.value || !normalizedSlug.value || !content.value || !pageType.value) {
    localError.value = "Title, slug, page type, and content are required.";
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
  const duplicatePlatform = settings.social_links.some((link, index) =>
    settings.social_links.findIndex((other) => other.platform === link.platform) !== index
  );
  if (isContactPage.value && duplicatePlatform) {
    localError.value = "Each social platform can only be added once.";
    return false;
  }
  return true;
}

function onSubmit() {
  if (!validate()) return;
  emit("submit", {
    slug: normalizedSlug.value,
    title: title.value,
    navigation_title: navigationTitle.value || null,
    excerpt: excerpt.value || null,
    content: content.value,
    page_type: pageType.value,
    settings: buildSettings(),
    meta_title: metaTitle.value || null,
    meta_description: metaDescription.value || null,
    is_published: isPublished.value,
    published_at: toIso(publishedAt.value),
    expires_at: toIso(expiresAt.value),
    applies_to_all_storefronts: appliesToAllStorefronts.value,
    storefront_ids: appliesToAllStorefronts.value ? [] : storefrontIds.value,
    display_order: displayOrder.value || 0,
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
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Page Identity</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Title *</label>
              <InputText v-model="title" fluid />
              <Message v-if="fieldError('title')" severity="error" size="small" variant="simple">{{ fieldError("title") }}</Message>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Navigation Title</label>
              <InputText v-model="navigationTitle" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Slug *</label>
              <InputText :model-value="slug" placeholder="about-us" fluid @update:model-value="onSlugInput" />
              <small class="text-slate-500">Globally unique URL slug. Changing a published slug may break public links.</small>
              <Message v-if="fieldError('slug')" severity="error" size="small" variant="simple">{{ fieldError("slug") }}</Message>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Page Type *</label>
              <Select v-model="pageType" :options="CONTENT_PAGE_TYPE_OPTIONS" option-label="label" option-value="value" fluid />
            </div>
            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Excerpt</label>
              <Textarea v-model="excerpt" rows="3" fluid />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="text-lg font-semibold text-slate-800">Main Content</h2>
            <Button type="button" label="Preview" icon="pi pi-eye" severity="secondary" outlined @click="previewVisible = true" />
          </div>
          <ContentManagementHtmlEditor v-model="content" />
          <Message v-if="fieldError('content')" severity="error" size="small" variant="simple">{{ fieldError("content") }}</Message>
        </div>

        <div v-if="isContactPage" class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Contact Information</h2>
          <Message severity="info" :closable="false" class="mb-4">
            These fields configure public contact information only. Customer messages are handled separately by the customer-facing backend.
          </Message>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Public Email</label>
              <InputText v-model="settings.email" type="email" fluid />
              <Message v-if="fieldError('settings.email')" severity="error" size="small" variant="simple">{{ fieldError("settings.email") }}</Message>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Public Phone</label>
              <InputText v-model="settings.phone" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">WhatsApp Number</label>
              <InputText v-model="settings.whatsapp" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Map URL</label>
              <InputText v-model="settings.map_url" placeholder="https://..." fluid />
            </div>
            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Business Hours</label>
              <Textarea v-model="settings.business_hours" rows="2" fluid />
            </div>
            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Address</label>
              <Textarea v-model="settings.address" rows="2" fluid />
            </div>
          </div>

          <div class="mt-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-semibold text-slate-800 m-0">Social Links</h3>
              <Button type="button" label="Add Link" icon="pi pi-plus" severity="secondary" outlined @click="addSocialLink" />
            </div>
            <div v-if="settings.social_links.length" class="grid grid-cols-1 gap-3">
              <div v-for="(link, index) in settings.social_links" :key="index" class="grid grid-cols-1 md:grid-cols-[12rem_1fr_auto] gap-3 items-end">
                <Select v-model="link.platform" :options="SOCIAL_PLATFORM_OPTIONS" option-label="label" option-value="value" />
                <InputText v-model="link.url" placeholder="https://..." />
                <Button type="button" icon="pi pi-trash" severity="danger" text rounded @click="removeSocialLink(index)" />
              </div>
            </div>
            <p v-else class="text-sm text-slate-500">No social links added.</p>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO</h2>
          <div class="grid grid-cols-1 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Meta Title</label>
              <InputText v-model="metaTitle" fluid />
              <small class="text-slate-500">{{ metaTitleLength }} characters. Recommended: around 50-60.</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-slate-700">Meta Description</label>
              <Textarea v-model="metaDescription" rows="3" fluid />
              <small class="text-slate-500">{{ metaDescriptionLength }} characters. Recommended: around 150-160.</small>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p class="m-0 text-blue-700 font-medium">{{ metaTitle || title || "Search result title" }}</p>
              <p class="m-0 text-sm text-green-700">glamrush.com/{{ normalizedSlug || "page-slug" }}</p>
              <p class="mt-1 mb-0 text-sm text-slate-600">{{ metaDescription || excerpt || "Search result description preview." }}</p>
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
            <Message v-if="fieldError('storefront_ids') || fieldError('storefront_ids.0')" severity="error" size="small" variant="simple">
              {{ fieldError("storefront_ids") || fieldError("storefront_ids.0") }}
            </Message>
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
      :title="title"
      :excerpt="excerpt"
      :html="content"
      :settings="isContactPage ? settings : null"
    />
  </div>
</template>
