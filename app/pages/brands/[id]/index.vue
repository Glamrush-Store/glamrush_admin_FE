<script setup>
import { useBrandStore } from "~/stores/brand";

const route = useRoute();
const brandStore = useBrandStore();

const id = route.params.id;

function formatDate(value) {
  if (!value) return "\u2014";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const brand = computed(() => brandStore.brand);

onMounted(() => {
  brandStore.fetchBrand(id);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/brands">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ brand?.name || "Brand Detail" }}
        </h1>
      </div>
      <div v-if="brand" class="flex items-center gap-2">
        <NuxtLink :to="`/brands/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="brandStore.brandLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Brand Details -->
    <div v-else-if="brand">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Image -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg border border-slate-200 p-4">
            <h2 class="text-lg font-semibold text-slate-800 mb-3">
              Brand Image
            </h2>
            <div v-if="brand.image">
              <img
                :src="brand.image.medium || brand.image.url"
                :alt="brand.name"
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
                <p class="font-medium text-slate-900">{{ brand.name }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Code</span>
                <p class="font-medium text-slate-900">
                  {{ brand.code || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Slug</span>
                <p class="font-medium text-slate-900">
                  {{ brand.slug || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sort Order</span>
                <p class="font-medium text-slate-900">
                  {{ brand.sort_order ?? "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Status</span>
                <p>
                  <Tag
                    :value="brand.is_active ? 'Active' : 'Inactive'"
                    :severity="brand.is_active ? 'success' : 'danger'"
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
                  {{ formatDate(brand.created_at) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Updated At</span>
                <p class="font-medium text-slate-900">
                  {{ formatDate(brand.updated_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Description</h2>
        <p class="font-medium text-slate-900">
          {{ brand.description || "\u2014" }}
        </p>
      </div>

      <!-- SEO / Meta Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO / Meta</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Meta Title</span>
            <p class="font-medium text-slate-900">
              {{ brand.meta_title || "\u2014" }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Meta Keywords</span>
            <p class="font-medium text-slate-900">
              {{ brand.meta_keywords || "\u2014" }}
            </p>
          </div>
          <div class="md:col-span-2">
            <span class="text-sm text-slate-500">Meta Description</span>
            <p class="font-medium text-slate-900">
              {{ brand.meta_description || "\u2014" }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
