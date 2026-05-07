<script setup>
import { useCollectionStore } from "~/stores/collection";
import { useProductStore } from "~/stores/product";

const route = useRoute();
const collectionStore = useCollectionStore();
const productStore = useProductStore();

const id = route.params.id;

function formatDate(value) {
  if (!value) return "\u2014";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const collection = computed(() => collectionStore.collection);

// --- Products dialog ---
const showManageDialog = ref(false);
const selectedProducts = ref([]);
const productSearch = ref("");
let productSearchTimeout = null;
const savingProducts = ref(false);

function openManageDialog() {
  selectedProducts.value = collection.value?.products
    ? collection.value.products.map((p) => ({ ...p }))
    : [];
  productStore.setFilter("search", "");
  productSearch.value = "";
  productStore.fetchProducts();
  showManageDialog.value = true;
}

function onProductSearch(val) {
  clearTimeout(productSearchTimeout);
  productSearchTimeout = setTimeout(() => {
    productStore.setFilter("search", val);
  }, 400);
}

function isProductSelected(product) {
  return selectedProducts.value.some((p) => p.id === product.id);
}

function toggleProduct(product) {
  const idx = selectedProducts.value.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    selectedProducts.value.splice(idx, 1);
  } else {
    selectedProducts.value.push(product);
  }
}

async function saveProducts() {
  savingProducts.value = true;
  try {
    await collectionStore.syncProducts(
      id,
      selectedProducts.value.map((p) => ({ id: p.id, sort_order: 0 })),
    );
    showManageDialog.value = false;
    await collectionStore.fetchCollection(id);
  } finally {
    savingProducts.value = false;
  }
}

async function removeProduct(productId) {
  await collectionStore.removeProduct(id, productId);
  await collectionStore.fetchCollection(id);
}

onMounted(() => {
  collectionStore.fetchCollection(id);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/collections">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ collection?.name || "Collection Detail" }}
        </h1>
      </div>
      <div v-if="collection" class="flex items-center gap-2">
        <NuxtLink :to="`/collections/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="collectionStore.collectionLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Collection Details -->
    <div v-else-if="collection">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Image -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg border border-slate-200 p-4">
            <h2 class="text-lg font-semibold text-slate-800 mb-3">
              Collection Image
            </h2>
            <div v-if="collection.image">
              <img
                :src="collection.image.medium || collection.image.url"
                :alt="collection.name"
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
                <p class="font-medium text-slate-900">{{ collection.name }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Slug</span>
                <p class="font-medium text-slate-900">
                  {{ collection.slug || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sort Order</span>
                <p class="font-medium text-slate-900">
                  {{ collection.sort_order ?? "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Status</span>
                <p>
                  <Tag
                    :value="collection.is_active ? 'Active' : 'Inactive'"
                    :severity="collection.is_active ? 'success' : 'danger'"
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
                  {{ formatDate(collection.created_at) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Updated At</span>
                <p class="font-medium text-slate-900">
                  {{ formatDate(collection.updated_at) }}
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
          {{ collection.description || "\u2014" }}
        </p>
      </div>

      <!-- SEO / Meta Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO / Meta</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Meta Title</span>
            <p class="font-medium text-slate-900">
              {{ collection.meta_title || "\u2014" }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Meta Keywords</span>
            <p class="font-medium text-slate-900">
              {{ collection.meta_keywords || "\u2014" }}
            </p>
          </div>
          <div class="md:col-span-2">
            <span class="text-sm text-slate-500">Meta Description</span>
            <p class="font-medium text-slate-900">
              {{ collection.meta_description || "\u2014" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Products Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-800">Products</h2>
          <Button
            label="Manage Products"
            icon="pi pi-cog"
            severity="secondary"
            @click="openManageDialog"
          />
        </div>

        <DataTable
          :value="collection.products || []"
          striped-rows
          size="small"
        >
          <Column field="name" header="Name" />
          <Column field="slug" header="Slug" />
          <Column field="type" header="Type" />
          <Column field="status" header="Status" />
          <Column field="sort_order" header="Sort Order" />
          <Column header="Actions" class="w-20">
            <template #body="{ data }">
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                size="small"
                @click="removeProduct(data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Manage Products Dialog -->
    <Dialog
      v-model:visible="showManageDialog"
      header="Manage Products"
      :style="{ width: '700px' }"
      modal
    >
      <div class="flex flex-col gap-4">
        <InputText
          v-model="productSearch"
          placeholder="Search products..."
          fluid
          @input="onProductSearch(productSearch)"
        />

        <div v-if="productStore.loading" class="flex justify-center py-6">
          <ProgressSpinner style="width: 32px; height: 32px" />
        </div>

        <DataTable
          v-else
          :value="productStore.products"
          striped-rows
          size="small"
          style="max-height: 400px; overflow-y: auto"
        >
          <Column header="" class="w-12">
            <template #body="{ data }">
              <Checkbox
                :model-value="isProductSelected(data)"
                :binary="true"
                @update:model-value="toggleProduct(data)"
              />
            </template>
          </Column>
          <Column field="name" header="Name" />
          <Column field="slug" header="Slug" />
          <Column field="type" header="Type" />
          <Column field="status" header="Status" />
        </DataTable>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="showManageDialog = false"
        />
        <Button
          label="Save"
          icon="pi pi-check"
          :loading="savingProducts"
          @click="saveProducts"
        />
      </template>
    </Dialog>
  </div>
</template>
