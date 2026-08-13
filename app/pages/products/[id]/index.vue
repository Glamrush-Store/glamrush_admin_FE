<script setup>
import { useProductStore } from "~/stores/product";
import { useConfirm } from "primevue/useconfirm";
import {
  getCategorySequence,
  getPrimaryProductCategory,
  getProductCategories,
} from "~/utils/categoryTree";

const route = useRoute();
const productStore = useProductStore();
const confirm = useConfirm();

const id = route.params.id;

function formatPrice(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "NGN",
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusSeverity(status) {
  if (status === "published") return "success";
  if (status === "draft") return "warn";
  if (status === "archived") return "secondary";
  return "info";
}

function typeSeverity(type) {
  return type === "variable" ? "info" : "success";
}

function formatAttributes(attrs) {
  if (!Array.isArray(attrs) || attrs.length === 0) return "—";
  return attrs.map((a) => `${a.type}: ${a.value}`).join(", ");
}

function onDelete() {
  confirm.require({
    message: "Are you sure you want to delete this product?",
    header: "Delete Product",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Delete",
    acceptClass: "p-button-danger",
    accept: () => {
      productStore.deleteProduct(id);
    },
  });
}

async function onArchive() {
  await productStore.archiveProduct(id);
}

const product = computed(() => productStore.product);
const primaryCategory = computed(() => getPrimaryProductCategory(product.value));
const productCategories = computed(() => getProductCategories(product.value));

// --- Variant detail modal ---
const variantModalVisible = ref(false);
const selectedVariant = ref(null);

function openVariantModal(variant) {
  selectedVariant.value = variant;
  variantModalVisible.value = true;
}

onMounted(() => {
  productStore.fetchProduct(id);
});
</script>

<template>
  <div>
    <ConfirmDialog />

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/products">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ product?.name || "Product Detail" }}
        </h1>
      </div>
      <div v-if="product" class="flex items-center gap-2">
        <NuxtLink :to="`/products/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
        <Button
          v-if="product.status !== 'archived'"
          label="Archive"
          icon="pi pi-box"
          severity="warn"
          @click="onArchive"
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          @click="onDelete"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="productStore.productLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Product Details -->
    <div v-else-if="product">
      <!-- Top grid: Image (1/3) + Right column cards (2/3) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Image -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg border border-slate-200 p-4">
            <h2 class="text-lg font-semibold text-slate-800 mb-3">
              Product Image
            </h2>
            <div v-if="product.images && product.images.length > 0">
              <Galleria
                :value="product.images"
                :num-visible="5"
                container-style="max-width: 100%"
                :show-thumbnails="product.images.length > 1"
                :show-indicators="product.images.length > 1"
              >
                <template #item="slotProps">
                  <img
                    :src="slotProps.item.medium || slotProps.item.url"
                    :alt="product.name"
                    class="w-full rounded"
                  />
                </template>
                <template #thumbnail="slotProps">
                  <img
                    :src="slotProps.item.thumb || slotProps.item.url"
                    :alt="product.name"
                    class="w-16 h-16 object-cover rounded"
                  />
                </template>
              </Galleria>
            </div>
            <div
              v-else
              class="flex items-center justify-center h-48 bg-slate-100 rounded text-slate-400"
            >
              <i class="pi pi-image text-4xl" />
            </div>
          </div>
        </div>

        <!-- Right: 2-column Cards -->
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- General Info Card -->
          <div
            class="md:col-span-2 bg-white rounded-lg border border-slate-200 p-6"
          >
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              General Information
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Name</span>
                <p class="font-medium text-slate-900">{{ product.name }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-500">SKU</span>
                <p class="font-medium text-slate-900">
                  {{ product.sku || "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Slug</span>
                <p class="font-medium text-slate-900">
                  {{ product.slug || "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sequence</span>
                <p class="font-medium text-slate-900">
                  {{ product.sequence ?? "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Type</span>
                <p>
                  <Tag
                    :value="product.type"
                    :severity="typeSeverity(product.type)"
                  />
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Status</span>
                <p>
                  <Tag
                    :value="product.status"
                    :severity="statusSeverity(product.status)"
                  />
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Primary Category</span>
                <p class="font-medium text-slate-900">
                  {{ primaryCategory?.name || "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Brand</span>
                <p class="font-medium text-slate-900">
                  {{ product.brand?.name || "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Vendor</span>
                <p class="font-medium text-slate-900">
                  {{ product.vendor?.business_name || "—" }}
                </p>
              </div>
              <div v-if="product.collection">
                <span class="text-sm text-slate-500">Collection</span>
                <p class="font-medium text-slate-900">
                  <NuxtLink
                    :to="`/collections/${product.collection.id}`"
                    class="text-primary-600 hover:underline"
                  >
                    {{ product.collection.name }}
                  </NuxtLink>
                </p>
              </div>
            </div>
          </div>

          <!-- Pricing Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">Pricing</h2>
            <div class="space-y-4">
              <div>
                <span class="text-sm text-slate-500">Price</span>
                <p class="font-medium text-slate-900">
                  {{ formatPrice(product.pricing?.price) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sale Price</span>
                <p class="font-medium text-slate-900">
                  {{ formatPrice(product.pricing?.sale_price) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sale Period</span>
                <p class="font-medium text-slate-900">
                  <template
                    v-if="
                      product.pricing?.sale_starts_at ||
                      product.pricing?.sale_ends_at
                    "
                  >
                    {{ formatDate(product.pricing?.sale_starts_at) }} –
                    {{ formatDate(product.pricing?.sale_ends_at) }}
                  </template>
                  <template v-else>—</template>
                </p>
              </div>
            </div>
          </div>

          <!-- Inventory & Flags Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              Inventory &amp; Flags
            </h2>
            <div class="space-y-4">
              <div>
                <span class="text-sm text-slate-500">Manage Stock</span>
                <p class="font-medium text-slate-900">
                  {{ product.inventory?.manage_stock ? "Yes" : "No" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Stock Quantity</span>
                <p class="font-medium text-slate-900">
                  {{ product.inventory?.stock_quantity ?? "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">In Stock</span>
                <p>
                  <Tag
                    :value="
                      product.inventory?.in_stock ? 'In Stock' : 'Out of Stock'
                    "
                    :severity="
                      product.inventory?.in_stock ? 'success' : 'danger'
                    "
                  />
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Featured</span>
                <p class="font-medium text-slate-900">
                  {{ product.flags?.is_featured ? "Yes" : "No" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sort Order</span>
                <p class="font-medium text-slate-900">
                  {{ product.flags?.sort_order ?? "—" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Metrics Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">Metrics</h2>
            <div class="space-y-4">
              <div>
                <span class="text-sm text-slate-500">Views Count</span>
                <p class="font-medium text-slate-900">
                  {{ product.metrics?.views_count ?? "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sales Count</span>
                <p class="font-medium text-slate-900">
                  {{ product.metrics?.sales_count ?? "—" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full-width cards below the grid -->

      <!-- Categories Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Categories</h2>
        <div v-if="productCategories.length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="category in productCategories"
            :key="category.id"
            class="flex items-center gap-2 rounded border border-slate-200 px-3 py-2"
          >
            <span class="font-medium text-slate-900">{{ category.name }}</span>
            <Tag
              v-if="String(category.id) === String(primaryCategory?.id)"
              value="Primary"
              severity="success"
            />
            <Tag
              v-if="getCategorySequence(category) !== null"
              :value="`#${getCategorySequence(category)}`"
              severity="secondary"
            />
          </div>
        </div>
        <p v-else class="font-medium text-slate-900">—</p>
      </div>

      <!-- Descriptions Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Descriptions</h2>
        <div class="space-y-4">
          <div>
            <span class="text-sm text-slate-500">Short Description</span>
            <p class="font-medium text-slate-900">
              {{ product.short_description || "—" }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Description</span>
            <div
              v-if="product.description"
              class="prose prose-sm max-w-none mt-1 text-slate-900"
              v-html="product.description"
            />
            <p v-else class="font-medium text-slate-900">—</p>
          </div>
        </div>
      </div>

      <!-- SEO / Meta Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">SEO / Meta</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Meta Title</span>
            <p class="font-medium text-slate-900">
              {{ product.meta?.title || "—" }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Meta Keywords</span>
            <p class="font-medium text-slate-900">
              {{ product.meta?.keywords || "—" }}
            </p>
          </div>
          <div class="md:col-span-2">
            <span class="text-sm text-slate-500">Meta Description</span>
            <p class="font-medium text-slate-900">
              {{ product.meta?.description || "—" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Timestamps Card -->
      <div class="mt-6 bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Timestamps</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Created At</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(product.timestamps?.created_at) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Updated At</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(product.timestamps?.updated_at) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Published At</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(product.published_at) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Variants Section -->
      <div
        v-if="product.type === 'variable'"
        class="mt-6 bg-white rounded-lg border border-slate-200 p-6"
      >
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Variants</h2>
        <DataTable :value="product.variants || []" striped-rows>
          <Column field="sku" header="SKU">
            <template #body="{ data }">
              {{ data.sku || "—" }}
            </template>
          </Column>
          <Column header="Attributes">
            <template #body="{ data }">
              {{ formatAttributes(data.attributes) }}
            </template>
          </Column>
          <Column header="Price">
            <template #body="{ data }">
              {{ formatPrice(data.pricing?.price) }}
            </template>
          </Column>
          <Column header="Sale Price">
            <template #body="{ data }">
              {{ formatPrice(data.pricing?.sale_price) }}
            </template>
          </Column>
          <Column header="Stock Qty">
            <template #body="{ data }">
              {{ data.inventory?.stock_quantity ?? "—" }}
            </template>
          </Column>
          <Column header="In Stock">
            <template #body="{ data }">
              <Tag
                :value="data.inventory?.in_stock ? 'Yes' : 'No'"
                :severity="data.inventory?.in_stock ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column field="is_default" header="Default">
            <template #body="{ data }">
              <i
                v-if="data.is_default"
                class="pi pi-check-circle text-green-500"
              />
              <span v-else>—</span>
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity(data.status)"
              />
            </template>
          </Column>
          <Column header="Actions" class="w-24">
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                severity="info"
                text
                rounded
                @click="openVariantModal(data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Variant Detail Modal -->
      <Dialog
        v-model:visible="variantModalVisible"
        header="Variant Details"
        modal
        dismissable-mask
        class="w-full max-w-2xl"
      >
        <template v-if="selectedVariant">
          <!-- Image Slider -->
          <ImageSlider :images="selectedVariant.images || []" height="280px" />

          <!-- Variant Info -->
          <div class="mt-5 space-y-4">
            <!-- SKU & Status row -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm text-slate-500">SKU</span>
                <p class="font-medium text-white">
                  {{ selectedVariant.sku || "—" }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Tag
                  v-if="selectedVariant.is_default"
                  value="Default"
                  severity="info"
                />
                <Tag
                  :value="selectedVariant.status"
                  :severity="statusSeverity(selectedVariant.status)"
                />
              </div>
            </div>

            <!-- Attributes -->
            <div
              v-if="
                selectedVariant.attributes &&
                selectedVariant.attributes.length > 0
              "
            >
              <span class="text-sm text-slate-500">Attributes</span>
              <div class="flex flex-wrap gap-2 mt-1">
                <Tag
                  v-for="attr in selectedVariant.attributes"
                  :key="attr.type"
                  :value="`${attr.type}: ${attr.value}`"
                  severity="secondary"
                />
              </div>
            </div>

            <!-- Pricing -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-slate-500">Price</span>
                <p class="font-medium text-white">
                  {{ formatPrice(selectedVariant.pricing?.price) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sale Price</span>
                <p class="font-medium text-white">
                  {{ formatPrice(selectedVariant.pricing?.sale_price) }}
                </p>
              </div>
              <div
                v-if="selectedVariant.pricing?.sale_starts_at"
                class="col-span-2"
              >
                <span class="text-sm text-slate-500">Sale Period</span>
                <p class="font-medium text-white">
                  {{ formatDate(selectedVariant.pricing?.sale_starts_at) }} –
                  {{ formatDate(selectedVariant.pricing?.sale_ends_at) }}
                </p>
              </div>
            </div>

            <!-- Inventory -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <span class="text-sm text-slate-500">Manage Stock</span>
                <p class="font-medium text-white">
                  {{ selectedVariant.inventory?.manage_stock ? "Yes" : "No" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Stock Qty</span>
                <p class="font-medium text-white">
                  {{ selectedVariant.inventory?.stock_quantity ?? "—" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">In Stock</span>
                <p>
                  <Tag
                    :value="
                      selectedVariant.inventory?.in_stock
                        ? 'In Stock'
                        : 'Out of Stock'
                    "
                    :severity="
                      selectedVariant.inventory?.in_stock ? 'success' : 'danger'
                    "
                  />
                </p>
              </div>
            </div>

            <!-- Sort Order -->
            <div>
              <span class="text-sm text-slate-500">Sort Order</span>
              <p class="font-medium text-white">
                {{ selectedVariant.sort_order ?? "—" }}
              </p>
            </div>
          </div>

          <!-- Edit button -->
          <div class="flex justify-end mt-5 pt-4 border-t border-slate-700">
            <NuxtLink
              :to="`/products/${id}/variants/${selectedVariant.id}/edit`"
            >
              <Button
                label="Edit Variant"
                icon="pi pi-pencil"
                severity="info"
              />
            </NuxtLink>
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>
