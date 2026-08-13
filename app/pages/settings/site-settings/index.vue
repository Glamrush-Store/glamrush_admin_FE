<script setup>
import { ApiError } from "~/composables/apiClient";
import { useSiteSettingStore } from "~/stores/siteSetting";

const store = useSiteSettingStore();
const confirm = useConfirm();
const toast = useToast();

const selectedCategoryId = ref(null);
const search = ref("");
const categoryDialogVisible = ref(false);
const settingDialogVisible = ref(false);
const categorySaving = ref(false);
const settingSaving = ref(false);
const editingCategory = ref(null);
const editingSetting = ref(null);
const localError = ref("");

const valueTypeOptions = [
  { label: "String", value: "string" },
  { label: "Boolean", value: "boolean" },
  { label: "Integer", value: "integer" },
  { label: "Decimal", value: "decimal" },
  { label: "Array", value: "array" },
  { label: "JSON", value: "json" },
];

const categoryForm = reactive({
  name: "",
  slug: "",
  description: "",
  sort_order: 0,
  is_active: true,
});

const settingForm = reactive({
  setting_category_id: null,
  key: "",
  value: "",
  value_type: "string",
  description: "",
  is_public: true,
  is_active: true,
});

const selectedCategory = computed(() => store.categories.find((category) => category.id === selectedCategoryId.value) || null);
const hasCategories = computed(() => store.categories.length > 0);

watch(selectedCategoryId, () => fetchSettings());

function showError(error, fallback) {
  const detail = error instanceof ApiError ? error.message : fallback;
  toast.add({ severity: "error", summary: "Error", detail, life: 4500 });
}

function resetCategoryForm(category = null) {
  editingCategory.value = category;
  categoryForm.name = category?.name || "";
  categoryForm.slug = category?.slug || "";
  categoryForm.description = category?.description || "";
  categoryForm.sort_order = category?.sort_order ?? 0;
  categoryForm.is_active = category?.is_active ?? true;
}

function resetSettingForm(setting = null) {
  editingSetting.value = setting;
  settingForm.setting_category_id = setting?.setting_category_id || selectedCategoryId.value;
  settingForm.key = setting?.key || "";
  settingForm.value_type = setting?.value_type || "string";
  settingForm.value = formatValueForEdit(setting?.value, setting?.value_type || "string");
  settingForm.description = setting?.description || "";
  settingForm.is_public = setting?.is_public ?? true;
  settingForm.is_active = setting?.is_active ?? true;
  localError.value = "";
}

function formatValueForEdit(value, type) {
  if ((type === "json" || type === "array") && value !== null && value !== undefined) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  return value ?? "";
}

function normalizeValue() {
  if (settingForm.value_type === "boolean") return Boolean(settingForm.value);
  if (settingForm.value_type === "integer") return settingForm.value === null || settingForm.value === "" ? null : Number.parseInt(settingForm.value, 10);
  if (settingForm.value_type === "decimal") return settingForm.value === null || settingForm.value === "" ? null : Number(settingForm.value);
  if (settingForm.value_type === "array" || settingForm.value_type === "json") {
    if (settingForm.value === null || settingForm.value === "") return null;
    try {
      return typeof settingForm.value === "string" ? JSON.parse(settingForm.value) : settingForm.value;
    } catch {
      localError.value = "Enter valid JSON for this value type.";
      return undefined;
    }
  }
  return settingForm.value;
}

function openCreateCategory() {
  resetCategoryForm();
  categoryDialogVisible.value = true;
}

function openEditCategory(category) {
  resetCategoryForm(category);
  categoryDialogVisible.value = true;
}

function openCreateSetting() {
  resetSettingForm();
  settingDialogVisible.value = true;
}

function openEditSetting(setting) {
  resetSettingForm(setting);
  settingDialogVisible.value = true;
}

async function fetchCategories() {
  await store.fetchCategories({ with_counts: 1 });
  if (!selectedCategoryId.value && store.categories.length) {
    selectedCategoryId.value = store.categories[0].id;
  }
}

async function fetchSettings() {
  await store.fetchSettings({ category_id: selectedCategoryId.value, search: search.value, per_page: 100 });
}

async function saveCategory() {
  categorySaving.value = true;
  try {
    const payload = {
      name: categoryForm.name,
      description: categoryForm.description || null,
      sort_order: categoryForm.sort_order ?? 0,
      is_active: categoryForm.is_active,
    };
    if (categoryForm.slug) payload.slug = categoryForm.slug;

    if (editingCategory.value) {
      await store.updateCategory(editingCategory.value.id, payload);
      toast.add({ severity: "success", summary: "Saved", detail: "Category updated", life: 3000 });
    } else {
      const response = await store.createCategory(payload);
      selectedCategoryId.value = response.data.id;
      toast.add({ severity: "success", summary: "Created", detail: "Category created", life: 3000 });
    }
    categoryDialogVisible.value = false;
    await fetchCategories();
    await fetchSettings();
  } catch (error) {
    showError(error, "Failed to save category");
  } finally {
    categorySaving.value = false;
  }
}

async function saveSetting() {
  localError.value = "";
  const normalizedValue = normalizeValue();
  if (normalizedValue === undefined) return;

  settingSaving.value = true;
  try {
    const payload = {
      setting_category_id: settingForm.setting_category_id,
      key: settingForm.key,
      value: normalizedValue,
      value_type: settingForm.value_type,
      description: settingForm.description || null,
      is_public: settingForm.is_public,
      is_active: settingForm.is_active,
    };
    if (editingSetting.value) {
      await store.updateSetting(editingSetting.value.id, payload);
      toast.add({ severity: "success", summary: "Saved", detail: "Setting updated", life: 3000 });
    } else {
      await store.createSetting(payload);
      toast.add({ severity: "success", summary: "Created", detail: "Setting created", life: 3000 });
    }
    settingDialogVisible.value = false;
    await fetchSettings();
    await fetchCategories();
  } catch (error) {
    showError(error, "Failed to save setting");
  } finally {
    settingSaving.value = false;
  }
}

function confirmDeleteCategory(category) {
  confirm.require({
    message: `Delete "${category.name}" and its settings?`,
    header: "Delete Category",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteCategory(category.id);
        if (selectedCategoryId.value === category.id) selectedCategoryId.value = store.categories[0]?.id || null;
        await fetchSettings();
        toast.add({ severity: "success", summary: "Deleted", detail: "Category deleted", life: 3000 });
      } catch (error) {
        showError(error, "Failed to delete category");
      }
    },
  });
}

function confirmDeleteSetting(setting) {
  confirm.require({
    message: `Delete "${setting.key}"?`,
    header: "Delete Setting",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deleteSetting(setting.id);
        await fetchCategories();
        toast.add({ severity: "success", summary: "Deleted", detail: "Setting deleted", life: 3000 });
      } catch (error) {
        showError(error, "Failed to delete setting");
      }
    },
  });
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

onMounted(async () => {
  await fetchCategories();
  await fetchSettings();
});
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Site Settings</h1>
        <p class="mt-1 text-sm text-slate-500">Manage grouped key-value configuration used by the public backend.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button label="New Category" icon="pi pi-folder-plus" severity="secondary" outlined @click="openCreateCategory" />
        <Button label="New Setting" icon="pi pi-plus" :disabled="!selectedCategoryId" @click="openCreateSetting" />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[22rem_1fr]">
      <section class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Categories</h2>
          <Button icon="pi pi-refresh" severity="secondary" text rounded :loading="store.loadingCategories" @click="fetchCategories" />
        </div>

        <div v-if="!hasCategories && !store.loadingCategories" class="rounded-md border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
          No settings categories yet.
        </div>

        <div class="flex flex-col gap-2">
          <button
            v-for="category in store.categories"
            :key="category.id"
            class="w-full rounded-md border p-3 text-left transition-colors"
            :class="selectedCategoryId === category.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'"
            @click="selectedCategoryId = category.id"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-slate-900">{{ category.name }}</div>
                <div class="truncate font-mono text-xs text-slate-500">{{ category.slug }}</div>
              </div>
              <Tag :value="category.is_active ? 'Active' : 'Inactive'" :severity="category.is_active ? 'success' : 'danger'" />
            </div>
            <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{{ category.settings_count ?? 0 }} settings</span>
              <span>Sort {{ category.sort_order ?? 0 }}</span>
            </div>
            <div class="mt-2 flex justify-end gap-1">
              <Button icon="pi pi-pencil" severity="secondary" text rounded @click.stop="openEditCategory(category)" />
              <Button icon="pi pi-trash" severity="danger" text rounded @click.stop="confirmDeleteCategory(category)" />
            </div>
          </button>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">{{ selectedCategory?.name || 'Settings' }}</h2>
            <p class="font-mono text-xs text-slate-500">{{ selectedCategory?.slug || 'Select a category' }}</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="Search settings" @keyup.enter="fetchSettings" />
            </IconField>
            <Button icon="pi pi-search" severity="secondary" outlined @click="fetchSettings" />
          </div>
        </div>

        <DataTable :value="store.settings" :loading="store.loadingSettings" striped-rows>
          <Column field="key" header="Key">
            <template #body="{ data }">
              <span class="font-mono text-sm text-slate-700">{{ data.key }}</span>
            </template>
          </Column>
          <Column field="value" header="Value">
            <template #body="{ data }">
              <span class="line-clamp-2 break-all text-sm text-slate-700">{{ displayValue(data.value) }}</span>
            </template>
          </Column>
          <Column field="value_type" header="Type">
            <template #body="{ data }">
              <Tag :value="data.value_type" severity="secondary" />
            </template>
          </Column>
          <Column header="Visibility">
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1">
                <Tag :value="data.is_public ? 'Public' : 'Private'" :severity="data.is_public ? 'info' : 'secondary'" />
                <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
              </div>
            </template>
          </Column>
          <Column header="Actions" class="w-28">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditSetting(data)" />
                <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDeleteSetting(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-sm text-slate-500">No settings found.</div>
          </template>
        </DataTable>
      </section>
    </div>

    <Dialog v-model:visible="categoryDialogVisible" modal :header="editingCategory ? 'Edit Category' : 'New Category'" :style="{ width: '34rem' }">
      <form class="grid gap-4" @submit.prevent="saveCategory">
        <div class="grid gap-2">
          <label class="text-sm font-medium text-slate-700">Name</label>
          <InputText v-model="categoryForm.name" required fluid />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium text-slate-700">Slug</label>
          <InputText v-model="categoryForm.slug" placeholder="Auto-generated when blank" fluid />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium text-slate-700">Description</label>
          <Textarea v-model="categoryForm.description" rows="3" fluid />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-700">Sort Order</label>
            <InputNumber v-model="categoryForm.sort_order" :use-grouping="false" fluid />
          </div>
          <div class="flex items-end gap-3 pb-2">
            <ToggleSwitch v-model="categoryForm.is_active" />
            <span class="text-sm text-slate-700">Active</span>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" severity="secondary" text type="button" @click="categoryDialogVisible = false" />
          <Button label="Save" icon="pi pi-check" type="submit" :loading="categorySaving" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="settingDialogVisible" modal :header="editingSetting ? 'Edit Setting' : 'New Setting'" :style="{ width: '46rem' }">
      <form class="grid gap-4" @submit.prevent="saveSetting">
        <Message v-if="localError" severity="error" size="small">{{ localError }}</Message>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-700">Category</label>
            <Select v-model="settingForm.setting_category_id" :options="store.categories" option-label="name" option-value="id" required fluid />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-700">Key</label>
            <InputText v-model="settingForm.key" required fluid />
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium text-slate-700">Value Type</label>
          <Select v-model="settingForm.value_type" :options="valueTypeOptions" option-label="label" option-value="value" fluid />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium text-slate-700">Value</label>
          <ToggleSwitch v-if="settingForm.value_type === 'boolean'" v-model="settingForm.value" />
          <InputNumber v-else-if="settingForm.value_type === 'integer'" v-model="settingForm.value" :use-grouping="false" fluid />
          <InputNumber v-else-if="settingForm.value_type === 'decimal'" v-model="settingForm.value" mode="decimal" :min-fraction-digits="0" :max-fraction-digits="4" fluid />
          <Textarea v-else-if="settingForm.value_type === 'json' || settingForm.value_type === 'array'" v-model="settingForm.value" rows="8" class="font-mono text-sm" fluid />
          <Textarea v-else v-model="settingForm.value" rows="3" fluid />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium text-slate-700">Description</label>
          <Textarea v-model="settingForm.description" rows="3" fluid />
        </div>
        <div class="flex flex-wrap gap-6">
          <label class="flex items-center gap-3 text-sm text-slate-700">
            <ToggleSwitch v-model="settingForm.is_public" />
            Public
          </label>
          <label class="flex items-center gap-3 text-sm text-slate-700">
            <ToggleSwitch v-model="settingForm.is_active" />
            Active
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" severity="secondary" text type="button" @click="settingDialogVisible = false" />
          <Button label="Save" icon="pi pi-check" type="submit" :loading="settingSaving" />
        </div>
      </form>
    </Dialog>
  </div>
</template>



