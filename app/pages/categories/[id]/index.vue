<script setup>
import { useCategoryStore } from "~/stores/category";
import {
  DEFAULT_ANNOUNCEMENT_PRIMARY,
  DEFAULT_ANNOUNCEMENT_SECONDARY,
} from "~/stores/storefrontAnnouncement";

const route = useRoute();
const categoryStore = useCategoryStore();

const id = route.params.id;

function formatDate(value) {
  if (!value) return "\u2014";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const category = computed(() => categoryStore.category);
const isRootCategory = computed(() => category.value && !category.value.parent_id);
const announcementPrimary = computed(() =>
  category.value?.announcement_primary_text || DEFAULT_ANNOUNCEMENT_PRIMARY,
);
const announcementSecondary = computed(() =>
  category.value?.announcement_secondary_text || DEFAULT_ANNOUNCEMENT_SECONDARY,
);

onMounted(() => {
  categoryStore.fetchCategory(id);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/categories">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ category?.name || "Category Detail" }}
        </h1>
      </div>
      <div v-if="category" class="flex items-center gap-2">
        <NuxtLink :to="`/categories/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="categoryStore.categoryLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Category Details -->
    <div v-else-if="category">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Image -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg border border-slate-200 p-4">
            <h2 class="text-lg font-semibold text-slate-800 mb-3">
              Category Image
            </h2>

            <div v-if="category.image">
              <img
                :src="category.image.medium || category.image.url"
                :alt="category.name"
                class="w-full rounded"
              />
            </div>
            <div
              v-else
              class="flex items-center justify-center h-48 bg-slate-100 rounded text-slate-400"
            >
              <i class="pi pi-image text-4xl" />
            </div>
          </div>
        </div>

        <!-- Right: Cards -->
        <div class="lg:col-span-2 grid grid-cols-1 gap-6">
          <!-- General Info Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              General Information
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Name</span>
                <p class="font-medium text-slate-900">{{ category.name }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Slug</span>
                <p class="font-medium text-slate-900">
                  {{ category.slug || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Parent ID</span>
                <p class="font-medium text-slate-900">
                  {{ category.parent_id || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sort Order</span>
                <p class="font-medium text-slate-900">
                  {{ category.sort_order ?? "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Status</span>
                <p>
                  <Tag
                    :value="category.is_active ? 'Active' : 'Inactive'"
                    :severity="category.is_active ? 'success' : 'danger'"
                  />
                </p>
              </div>
            </div>
          </div>

          <!-- Timestamps Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              Timestamps
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Created At</span>
                <p class="font-medium text-slate-900">
                  {{ formatDate(category.created_at) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Updated At</span>
                <p class="font-medium text-slate-900">
                  {{ formatDate(category.updated_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Storefront Announcement Card -->
          <div v-if="isRootCategory" class="bg-white rounded-lg border border-slate-200 p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 class="text-lg font-semibold text-slate-800 m-0">
                Storefront Header Announcement
              </h2>
              <NuxtLink :to="`/settings/storefront-announcement?storefront=${category.id}`">
                <Button label="Manage" icon="pi pi-megaphone" size="small" />
              </NuxtLink>
            </div>

            <div class="rounded-lg overflow-hidden border border-slate-200 mb-4">
              <div class="bg-slate-950 text-white px-4 py-3">
                <div class="flex items-center justify-center gap-4 text-center text-sm font-medium">
                  <span>{{ announcementPrimary }}</span>
                  <span class="hidden md:inline-block h-4 w-px bg-white/35" />
                  <span class="hidden md:inline text-white/80">{{ announcementSecondary }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Primary message</span>
                <p class="font-medium text-slate-900">{{ announcementPrimary }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Secondary message</span>
                <p class="font-medium text-slate-900">{{ announcementSecondary }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Description</h2>
        <p class="font-medium text-slate-900">
          {{ category.description || "\u2014" }}
        </p>
      </div>

      <!-- SEO / Meta Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO / Meta</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Meta Title</span>
            <p class="font-medium text-slate-900">
              {{ category.meta_title || "\u2014" }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Meta Keywords</span>
            <p class="font-medium text-slate-900">
              {{ category.meta_keywords || "\u2014" }}
            </p>
          </div>
          <div class="md:col-span-2">
            <span class="text-sm text-slate-500">Meta Description</span>
            <p class="font-medium text-slate-900">
              {{ category.meta_description || "\u2014" }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
