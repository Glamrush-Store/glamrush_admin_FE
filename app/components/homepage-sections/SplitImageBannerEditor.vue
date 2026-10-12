<script setup>
import {
  SPLIT_IMAGE_BANNER_IMAGE_FIELDS,
  SPLIT_IMAGE_BANNER_SLOTS,
  orderedSplitItems,
} from "~/constants/homepageSections";

const props = defineProps({
  items: { type: Array, default: () => [] },
  files: { type: Object, default: () => ({}) },
  existingImages: { type: Object, default: () => ({}) },
  errors: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  isEditing: { type: Boolean, default: false },
});

const emit = defineEmits(["update:items", "update:files"]);

const fileUrls = reactive({});
const previewMode = shallowRef("desktop");

const sortedItems = computed(() => orderedSplitItems(props.items));
const desktopItems = computed(() => sortedItems.value.filter((item) => item.slot === "left" || item.slot === "right"));

function errorFor(field) {
  const direct = props.errors?.[field];
  if (Array.isArray(direct)) return direct[0];
  if (direct) return direct;

  const bracketField = field.replaceAll(".", "][").replace("[", ".").replace("]", "");
  const bracketError = props.errors?.[bracketField];
  return Array.isArray(bracketError) ? bracketError[0] : bracketError || "";
}

function itemError(index, field) {
  return errorFor(`config.items.${index}.${field}`) || errorFor(`config[items][${index}][${field}]`);
}

function updateItem(slot, patch) {
  const next = props.items.map((item) => (item.slot === slot ? { ...item, ...patch } : item));
  emit("update:items", next);
}

function moveItem(slot, direction) {
  const item = props.items.find((entry) => entry.slot === slot);
  if (!item) return;

  const other = props.items.find((entry) => entry.slot !== slot);
  if (!other) return;

  const nextOrder = Number(item.sort_order || 0) + direction;
  if (nextOrder < 0 || nextOrder > 1) return;

  emit("update:items", props.items.map((entry) => {
    if (entry.slot === slot) return { ...entry, sort_order: nextOrder };
    if (entry.slot === other.slot) return { ...entry, sort_order: Number(item.sort_order || 0) };
    return entry;
  }));
}

function setCtaEnabled(slot, enabled) {
  const patch = enabled
    ? { cta_enabled: true }
    : { cta_enabled: false, cta_label: "", cta_url: "" };
  updateItem(slot, patch);
}

function onFileChange(field, event) {
  const file = event.target.files?.[0] || null;
  const next = { ...props.files, [field]: file };
  if (!file) delete next[field];
  emit("update:files", next);
}

function clearFile(field) {
  const next = { ...props.files };
  delete next[field];
  emit("update:files", next);
}

function imageUrl(field) {
  if (props.files?.[field]) return fileUrls[field] || "";
  return props.existingImages?.[field] || "";
}

function imageFieldForSlot(slot) {
  return SPLIT_IMAGE_BANNER_SLOTS.find((option) => option.value === slot)?.imageField;
}

watch(
  () => props.files,
  (files) => {
    SPLIT_IMAGE_BANNER_IMAGE_FIELDS.forEach((field) => {
      if (fileUrls[field]) {
        URL.revokeObjectURL(fileUrls[field]);
        delete fileUrls[field];
      }
      if (files?.[field]) {
        fileUrls[field] = URL.createObjectURL(files[field]);
      }
    });
  },
  { deep: true, immediate: true }
);

onBeforeUnmount(() => {
  Object.values(fileUrls).forEach((url) => URL.revokeObjectURL(url));
});
</script>

<template>
  <div class="space-y-4">
    <Message v-if="errorFor('config.items')" severity="error" :closable="false">
      {{ errorFor("config.items") }}
    </Message>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section
        v-for="(item, index) in desktopItems"
        :key="item.slot"
        class="rounded-lg border border-slate-200 bg-white p-4"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h4 class="m-0 text-sm font-semibold text-slate-900">
              {{ item.slot === "left" ? "Left desktop panel" : "Right desktop panel" }}
            </h4>
            <p class="m-0 mt-1 text-xs text-slate-500">Fixed {{ item.slot }} slot</p>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-tooltip.top="'Move earlier'"
              icon="pi pi-arrow-up"
              severity="secondary"
              text
              rounded
              :disabled="loading || Number(item.sort_order) === 0"
              @click="moveItem(item.slot, -1)"
            />
            <Button
              v-tooltip.top="'Move later'"
              icon="pi pi-arrow-down"
              severity="secondary"
              text
              rounded
              :disabled="loading || Number(item.sort_order) === 1"
              @click="moveItem(item.slot, 1)"
            />
          </div>
        </div>

        <div class="mb-3 flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-700">Image</label>
          <div class="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <img
              v-if="imageUrl(imageFieldForSlot(item.slot))"
              :src="imageUrl(imageFieldForSlot(item.slot))"
              alt=""
              class="h-44 w-full object-cover"
            >
            <div v-else class="flex h-44 items-center justify-center text-sm text-slate-500">
              No image selected
            </div>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="loading"
            class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            @change="onFileChange(imageFieldForSlot(item.slot), $event)"
          >
          <Button
            v-if="files[imageFieldForSlot(item.slot)]"
            label="Keep existing image"
            icon="pi pi-times"
            text
            severity="secondary"
            size="small"
            :disabled="loading"
            @click="clearFile(imageFieldForSlot(item.slot))"
          />
          <small v-if="errorFor(imageFieldForSlot(item.slot))" class="text-red-500">
            {{ errorFor(imageFieldForSlot(item.slot)) }}
          </small>
        </div>

        <div class="mb-3 flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Description *</label>
          <Textarea
            :model-value="item.description"
            rows="4"
            auto-resize
            placeholder="Banner description shown over this panel"
            :disabled="loading"
            @update:model-value="updateItem(item.slot, { description: $event })"
          />
          <small v-if="itemError(index, 'description')" class="text-red-500">
            {{ itemError(index, "description") }}
          </small>
        </div>

        <div class="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_10rem]">
          <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
            <ToggleSwitch
              :model-value="item.cta_enabled"
              :disabled="loading"
              @update:model-value="setCtaEnabled(item.slot, $event)"
            />
            Add CTA
          </label>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Sort order</label>
            <InputNumber
              :model-value="Number(item.sort_order || 0)"
              :min="0"
              :max="1"
              show-buttons
              :disabled="loading"
              @update:model-value="updateItem(item.slot, { sort_order: $event ?? 0 })"
            />
            <small v-if="itemError(index, 'sort_order')" class="text-red-500">
              {{ itemError(index, "sort_order") }}
            </small>
          </div>
        </div>

        <div v-if="item.cta_enabled" class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">CTA label</label>
            <InputText
              :model-value="item.cta_label"
              placeholder="Shop now"
              :disabled="loading"
              @update:model-value="updateItem(item.slot, { cta_label: $event })"
            />
            <small v-if="itemError(index, 'cta_label')" class="text-red-500">
              {{ itemError(index, "cta_label") }}
            </small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">CTA URL</label>
            <InputText
              :model-value="item.cta_url"
              placeholder="/collections/new"
              :disabled="loading"
              @update:model-value="updateItem(item.slot, { cta_url: $event })"
            />
            <small v-if="itemError(index, 'cta_url')" class="text-red-500">
              {{ itemError(index, "cta_url") }}
            </small>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-col gap-1">
        <h4 class="m-0 text-sm font-semibold text-slate-900">Mobile image</h4>
        <p class="m-0 text-xs text-slate-500">Shown instead of the two desktop panels on small screens.</p>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[16rem_1fr] md:items-start">
        <div class="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
          <img
            v-if="imageUrl('mobile_image')"
            :src="imageUrl('mobile_image')"
            alt=""
            class="aspect-[4/5] w-full object-cover"
          >
          <div v-else class="flex aspect-[4/5] items-center justify-center text-sm text-slate-500">
            No mobile image selected
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="loading"
            class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            @change="onFileChange('mobile_image', $event)"
          >
          <Button
            v-if="files.mobile_image"
            label="Keep existing mobile image"
            icon="pi pi-times"
            text
            severity="secondary"
            size="small"
            :disabled="loading"
            @click="clearFile('mobile_image')"
          />
          <small v-if="errorFor('mobile_image')" class="text-red-500">{{ errorFor("mobile_image") }}</small>
        </div>
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 class="m-0 text-sm font-semibold text-slate-900">Responsive preview</h4>
          <p class="m-0 mt-1 text-xs text-slate-500">Administrative preview only.</p>
        </div>
        <SelectButton
          v-model="previewMode"
          :options="[
            { label: 'Desktop', value: 'desktop' },
            { label: 'Mobile', value: 'mobile' },
          ]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
      </div>

      <div v-if="previewMode === 'desktop'" class="relative h-72 overflow-hidden rounded-lg bg-slate-900">
        <div class="absolute inset-0 grid grid-cols-2">
          <div
            v-for="item in sortedItems"
            :key="`preview-${item.slot}`"
            class="relative overflow-hidden"
            :class="item.slot === 'left' ? 'split-left' : 'split-right'"
          >
            <img
              v-if="imageUrl(imageFieldForSlot(item.slot))"
              :src="imageUrl(imageFieldForSlot(item.slot))"
              alt=""
              class="h-full w-full object-cover"
            >
            <div v-else class="flex h-full items-center justify-center bg-slate-700 text-sm text-white">
              {{ item.slot }} image
            </div>
            <div class="absolute inset-0 bg-slate-950/35" />
            <div class="absolute inset-x-0 bottom-0 p-5 text-white">
              <p class="m-0 max-w-sm text-lg font-semibold leading-snug">{{ item.description || "Panel description" }}</p>
              <span v-if="item.cta_label && item.cta_url" class="mt-3 inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-950">
                {{ item.cta_label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="mx-auto max-w-[18rem] overflow-hidden rounded-lg bg-slate-900">
        <img
          v-if="imageUrl('mobile_image')"
          :src="imageUrl('mobile_image')"
          alt=""
          class="aspect-[4/5] w-full object-cover"
        >
        <div v-else class="flex aspect-[4/5] items-center justify-center bg-slate-700 text-sm text-white">
          Mobile image
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.split-left {
  clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%);
}

.split-right {
  margin-left: -7%;
  clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%);
}
</style>
