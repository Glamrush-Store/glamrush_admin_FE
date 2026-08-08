<script setup>
import { Form } from "@primevue/forms";
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import {
  DEFAULT_ANNOUNCEMENT_PRIMARY,
  DEFAULT_ANNOUNCEMENT_SECONDARY,
  useStorefrontAnnouncementStore,
} from "~/stores/storefrontAnnouncement";

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const { can } = usePermissions();
const store = useStorefrontAnnouncementStore();

const canView = computed(() => can("View_Category"));
const canUpdate = computed(() => can("Update_Category"));
const formKey = shallowRef(0);
const serverFieldErrors = ref({});
const draft = reactive({
  announcement_primary_text: "",
  announcement_secondary_text: "",
});

const resolver = yupResolver(object({
  announcement_primary_text: string().nullable().max(160, "Primary message must be 160 characters or fewer"),
  announcement_secondary_text: string().nullable().max(160, "Secondary message must be 160 characters or fewer"),
}));

function toInputValue(value) {
  return value ?? "";
}

const initialValues = computed(() => ({
  announcement_primary_text: store.announcement.announcement_primary_text,
  announcement_secondary_text: store.announcement.announcement_secondary_text,
}));

const selectedStorefront = computed(() =>
  store.storefronts.find((storefront) => storefront.id === store.selectedStorefrontId),
);

const primaryPreview = computed(() =>
  draft.announcement_primary_text.trim() || DEFAULT_ANNOUNCEMENT_PRIMARY,
);

const secondaryPreview = computed(() =>
  draft.announcement_secondary_text.trim() || DEFAULT_ANNOUNCEMENT_SECONDARY,
);

const primaryCount = computed(() => draft.announcement_primary_text.length);
const secondaryCount = computed(() => draft.announcement_secondary_text.length);

const hasChanges = computed(() =>
  draft.announcement_primary_text !== toInputValue(initialValues.value.announcement_primary_text)
  || draft.announcement_secondary_text !== toInputValue(initialValues.value.announcement_secondary_text),
);

const saveDisabled = computed(() =>
  store.loading
  || store.storefrontLoading
  || store.saving
  || !store.selectedStorefrontId
  || !hasChanges.value
  || !canUpdate.value,
);

function syncDraftFromStore() {
  draft.announcement_primary_text = toInputValue(initialValues.value.announcement_primary_text);
  draft.announcement_secondary_text = toInputValue(initialValues.value.announcement_secondary_text);
  serverFieldErrors.value = {};
  formKey.value += 1;
}

function fieldError(field) {
  return serverFieldErrors.value[field]?.[0] || "";
}

function normalizePayload(values) {
  return {
    announcement_primary_text: values.announcement_primary_text == null ? null : values.announcement_primary_text.trim(),
    announcement_secondary_text: values.announcement_secondary_text == null ? null : values.announcement_secondary_text.trim(),
  };
}

async function loadStorefront(categoryId, options = {}) {
  const category = await store.selectStorefront(categoryId);
  syncDraftFromStore();

  if (category && options.syncQuery !== false) {
    await router.replace({
      query: {
        ...route.query,
        storefront: category.id,
      },
    });
  }
}

async function changeStorefront(categoryId) {
  if (categoryId === store.selectedStorefrontId) return;

  if (!hasChanges.value) {
    await loadStorefront(categoryId);
    return;
  }

  confirm.require({
    message: "You have unsaved announcement changes. Switch storefront and discard them?",
    header: "Discard Changes?",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Stay",
    acceptLabel: "Switch",
    accept: async () => {
      await loadStorefront(categoryId);
    },
  });
}

async function saveAnnouncement({ valid, values }) {
  if (!valid || !store.selectedStorefrontId || !canUpdate.value) return;

  try {
    const response = await store.updateAnnouncement(store.selectedStorefrontId, normalizePayload(values));
    serverFieldErrors.value = {};
    syncDraftFromStore();
    toast.add({
      severity: "success",
      summary: "Announcement saved",
      detail: response.message || "Storefront header announcement was updated.",
      life: 3000,
    });
  } catch {
    serverFieldErrors.value = store.validationErrors;
  }
}

onMounted(async () => {
  if (!canView.value) return;

  const storefronts = await store.fetchStorefronts();
  if (!storefronts.length) return;

  const queryStorefront = route.query.storefront;
  const queryMatch = storefronts.find((storefront) => storefront.id === queryStorefront);
  const fragrances = storefronts.find((storefront) => storefront.name?.toLowerCase() === "fragrances");
  const defaultStorefront = queryMatch || fragrances || storefronts[0];

  await loadStorefront(defaultStorefront.id, { syncQuery: Boolean(queryMatch) });
});
</script>

<template>
  <div>
    <Toast />
    <ConfirmDialog />

    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <i class="pi pi-megaphone text-primary text-xl" />
        <h1 class="text-2xl font-bold text-slate-900 m-0">Header Announcement</h1>
      </div>
      <p class="text-slate-500 m-0">
        Manage the announcement copy displayed above the customer-facing storefront header.
      </p>
    </div>

    <div v-if="!canView" class="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <i class="pi pi-lock text-3xl text-slate-400" />
      <h2 class="text-xl font-semibold text-slate-900 mt-4 mb-2">Permission Required</h2>
      <p class="text-slate-500 m-0">Ask a super administrator for the View_Category permission.</p>
    </div>

    <div v-else class="space-y-6">
      <Message v-if="store.error" severity="error" :closable="false">
        {{ store.error }}
      </Message>

      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <label class="block text-sm font-medium text-slate-700 mb-2">Storefront</label>
        <Select
          :model-value="store.selectedStorefrontId"
          :options="store.storefronts"
          option-label="name"
          option-value="id"
          placeholder="Select storefront"
          class="w-full md:w-96"
          :loading="store.storefrontLoading"
          :disabled="store.storefrontLoading || store.saving"
          @update:model-value="changeStorefront"
        />
        <p v-if="selectedStorefront" class="text-sm text-slate-500 mt-2 mb-0">
          Editing {{ selectedStorefront.name }} storefront.
        </p>
      </div>

      <div v-if="store.loading || store.storefrontLoading" class="bg-white rounded-lg border border-slate-200 p-10 flex justify-center">
        <ProgressSpinner />
      </div>

      <div v-else class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <Form
            :key="formKey"
            v-slot="$form"
            :initial-values="initialValues"
            :resolver="resolver"
            class="space-y-5"
            @submit="saveAnnouncement"
          >
            <Message v-if="!canUpdate" severity="warn" :closable="false">
              You can view this announcement, but need Update_Category permission to edit it.
            </Message>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label for="announcement_primary_text" class="text-sm font-medium text-slate-700">Primary message</label>
                <span class="text-xs" :class="primaryCount > 160 ? 'text-red-600' : 'text-slate-500'">
                  {{ primaryCount }}/160
                </span>
              </div>
              <Textarea
                id="announcement_primary_text"
                name="announcement_primary_text"
                rows="4"
                fluid
                placeholder="Free Lagos delivery on orders over ₦100,000"
                :disabled="!canUpdate || store.saving"
                :invalid="$form.announcement_primary_text?.invalid || Boolean(fieldError('announcement_primary_text'))"
                @update:model-value="draft.announcement_primary_text = $event || ''"
              />
              <p class="text-xs text-slate-500 m-0">Visible on all screen sizes.</p>
              <Message
                v-if="$form.announcement_primary_text?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.announcement_primary_text.error?.message }}
              </Message>
              <Message v-else-if="fieldError('announcement_primary_text')" severity="error" size="small" variant="simple">
                {{ fieldError("announcement_primary_text") }}
              </Message>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label for="announcement_secondary_text" class="text-sm font-medium text-slate-700">Secondary message</label>
                <span class="text-xs" :class="secondaryCount > 160 ? 'text-red-600' : 'text-slate-500'">
                  {{ secondaryCount }}/160
                </span>
              </div>
              <Textarea
                id="announcement_secondary_text"
                name="announcement_secondary_text"
                rows="4"
                fluid
                placeholder="Complimentary scent consultation"
                :disabled="!canUpdate || store.saving"
                :invalid="$form.announcement_secondary_text?.invalid || Boolean(fieldError('announcement_secondary_text'))"
                @update:model-value="draft.announcement_secondary_text = $event || ''"
              />
              <p class="text-xs text-slate-500 m-0">Visible on tablet and desktop only.</p>
              <Message
                v-if="$form.announcement_secondary_text?.invalid"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.announcement_secondary_text.error?.message }}
              </Message>
              <Message v-else-if="fieldError('announcement_secondary_text')" severity="error" size="small" variant="simple">
                {{ fieldError("announcement_secondary_text") }}
              </Message>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                :disabled="store.saving || !hasChanges"
                @click="syncDraftFromStore"
              />
              <Button
                type="submit"
                label="Save Announcement"
                icon="pi pi-save"
                :loading="store.saving"
                :disabled="saveDisabled"
              />
            </div>
          </Form>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6 h-fit">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 m-0">Live Preview</h2>
            <Tag value="Storefront" severity="secondary" />
          </div>

          <div class="rounded-lg overflow-hidden border border-slate-200">
            <div class="bg-slate-950 text-white px-4 py-3">
              <div class="mx-auto flex items-center justify-center gap-4 text-center text-sm font-medium">
                <span>{{ primaryPreview }}</span>
                <span class="hidden md:inline-block h-4 w-px bg-white/35" />
                <span class="hidden md:inline text-white/80">{{ secondaryPreview }}</span>
              </div>
            </div>
            <div class="bg-slate-50 px-4 py-5">
              <div class="h-3 w-28 rounded bg-slate-200 mb-4" />
              <div class="grid grid-cols-3 gap-3">
                <div class="h-16 rounded bg-slate-200" />
                <div class="h-16 rounded bg-slate-200" />
                <div class="h-16 rounded bg-slate-200" />
              </div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div class="flex items-start gap-3 rounded border border-slate-200 p-3">
              <i class="pi pi-mobile text-slate-500 mt-0.5" />
              <div>
                <p class="font-medium text-slate-800 m-0">Mobile</p>
                <p class="text-slate-500 m-0">Shows the primary message only.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 rounded border border-slate-200 p-3">
              <i class="pi pi-desktop text-slate-500 mt-0.5" />
              <div>
                <p class="font-medium text-slate-800 m-0">Tablet and desktop</p>
                <p class="text-slate-500 m-0">Shows both primary and secondary messages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
