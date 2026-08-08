<script setup>
import { useProductStore } from "~/stores/product";
import { CATEGORIES, BRANDS, VENDORS } from "~/constants/endpoints";

const productStore = useProductStore();

const searchInput = ref("");
let searchTimeout = null;

const categoryOptions = ref([]);
const brandOptions = ref([]);
const vendorOptions = ref([]);

const typeOptions = [
  { label: "All", value: null },
  { label: "Simple", value: "simple" },
  { label: "Variable", value: "variable" },
];

const statusOptions = [
  { label: "All", value: null },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const dateRange = ref(null);

const allColumns = [
  { field: "name", header: "Name", default: true },
  { field: "slug", header: "Slug", default: false },
  { field: "type", header: "Type", default: true },
  { field: "status", header: "Status", default: true },
  { field: "price", header: "Price", default: true },
  { field: "sale_price", header: "Sale Price", default: false },
  { field: "sku", header: "SKU", default: false },
  { field: "stock_qty", header: "Stock Qty", default: false },
  { field: "sort_order", header: "Sort Order", default: false },
  { field: "category.name", header: "Category", default: true },
  { field: "brand.name", header: "Brand", default: true },
  { field: "vendor.business_name", header: "Vendor", default: false },
  { field: "created_at", header: "Created At", default: true },
];

const visibleColumns = ref(
  allColumns.filter((c) => c.default).map((c) => c.field),
);

function isVisible(field) {
  return visibleColumns.value.includes(field);
}

function onSearchInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    productStore.setFilter("search", val);
  }, 400);
}

function onTypeChange(val) {
  productStore.setFilter("type", val);
}

function onStatusChange(val) {
  productStore.setFilter("status", val);
}

function onCategoryChange(val) {
  productStore.setFilter("category_id", val);
}

function onBrandChange(val) {
  productStore.setFilter("brand_id", val);
}

function onVendorChange(val) {
  productStore.setFilter("vendor_id", val);
}

function onDateChange(val) {
  if (val && val.length === 2) {
    const formatDateVal = (d) => {
      const date = new Date(d);
      return date.toISOString().split("T")[0];
    };
    productStore.setFilter("date_from", formatDateVal(val[0]));
    productStore.filters.date_to = formatDateVal(val[1]);
    productStore.fetchProducts();
  } else {
    productStore.setFilter("date_from", null);
    productStore.filters.date_to = null;
  }
}

function clearFilters() {
  searchInput.value = "";
  dateRange.value = null;
  productStore.resetFilters();
}

function onSort(event) {
  const order = event.sortOrder === 1 ? "asc" : "desc";
  productStore.setSorting(event.sortField, order);
}

function onPageChange(event) {
  productStore.setPage(event.page + 1);
}

function formatPrice(value) {
  if (value == null) return "-";
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "NGN",
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function typeSeverity(type) {
  return type === "variable" ? "info" : "success";
}

function statusSeverity(status) {
  if (status === "published") return "success";
  if (status === "draft") return "warn";
  if (status === "archived") return "secondary";
  return "info";
}

async function loadFilterOptions() {
  const api = useApiClient();
  try {
    const [catRes, brandRes, vendorRes] = await Promise.all([
      api.get(`${CATEGORIES.LIST}?per_page=100`),
      api.get(`${BRANDS.LIST}?per_page=100`),
      api.get(`${VENDORS.LIST}?per_page=100`),
    ]);
    categoryOptions.value = (catRes.data || []).map((c) => ({
      label: c.name,
      value: c.id,
    }));
    brandOptions.value = (brandRes.data || []).map((b) => ({
      label: b.name,
      value: b.id,
    }));
    vendorOptions.value = (vendorRes.data || []).map((v) => ({
      label: v.business_name,
      value: v.id,
    }));
  } catch {
    // Filter options failed to load — dropdowns will be empty
  }
}

onMounted(() => {
  productStore.fetchProducts();
  loadFilterOptions();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Products</h1>
      <div class="flex items-center gap-2">
        <NuxtLink to="/products/create">
          <Button label="Add New Product" icon="pi pi-plus" />
        </NuxtLink>
        <MultiSelect
        v-model="visibleColumns"
        :options="allColumns"
        option-label="header"
        option-value="field"
        placeholder="Columns"
        class="w-56"
      >
        <template #dropdownicon>
          <i class="pi pi-cog" />
        </template>
      </MultiSelect>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Search</label>
        <InputText
          v-model="searchInput"
          placeholder="Search by name..."
          class="w-48"
          @input="onSearchInput(searchInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Type</label>
        <Select
          :model-value="productStore.filters.type"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="All Types"
          class="w-40"
          @update:model-value="onTypeChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="productStore.filters.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="All Statuses"
          class="w-40"
          @update:model-value="onStatusChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Category</label>
        <Select
          :model-value="productStore.filters.category_id"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          placeholder="All Categories"
          show-clear
          class="w-44"
          @update:model-value="onCategoryChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Brand</label>
        <Select
          :model-value="productStore.filters.brand_id"
          :options="brandOptions"
          option-label="label"
          option-value="value"
          placeholder="All Brands"
          show-clear
          class="w-40"
          @update:model-value="onBrandChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Vendor</label>
        <Select
          :model-value="productStore.filters.vendor_id"
          :options="vendorOptions"
          option-label="label"
          option-value="value"
          placeholder="All Vendors"
          show-clear
          class="w-40"
          @update:model-value="onVendorChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Date Range</label>
        <DatePicker
          v-model="dateRange"
          selection-mode="range"
          placeholder="Select dates"
          date-format="yy-mm-dd"
          class="w-56"
          @update:model-value="onDateChange"
        />
      </div>

      <Button
        label="Clear Filters"
        icon="pi pi-filter-slash"
        severity="secondary"
        text
        @click="clearFilters"
      />
    </div>

    <!-- DataTable -->
    <DataTable
      :value="productStore.products"
      :loading="productStore.loading"
      lazy
      :total-records="productStore.pagination.total"
      @sort="onSort"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
    >
      <Column v-if="isVisible('name')" field="name" header="Name" />
      <Column v-if="isVisible('slug')" field="slug" header="Slug" />
      <Column v-if="isVisible('type')" field="type" header="Type">
        <template #body="{ data }">
          <Tag :value="data.type" :severity="typeSeverity(data.type)" />
        </template>
      </Column>
      <Column v-if="isVisible('status')" field="status" header="Status">
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column v-if="isVisible('price')" field="price" header="Price" sortable>
        <template #body="{ data }">
          {{ formatPrice(data.price) }}
        </template>
      </Column>
      <Column
        v-if="isVisible('sale_price')"
        field="sale_price"
        header="Sale Price"
      >
        <template #body="{ data }">
          {{ formatPrice(data.sale_price) }}
        </template>
      </Column>
      <Column v-if="isVisible('sku')" field="sku" header="SKU">
        <template #body="{ data }">
          {{ data.sku || "-" }}
        </template>
      </Column>
      <Column
        v-if="isVisible('stock_qty')"
        field="stock_qty"
        header="Stock Qty"
      >
        <template #body="{ data }">
          {{ data.stock_qty != null ? data.stock_qty : "-" }}
        </template>
      </Column>
      <Column
        v-if="isVisible('sort_order')"
        field="sort_order"
        header="Sort Order"
        sortable
      >
        <template #body="{ data }">
          {{ data.sort_order != null ? data.sort_order : "-" }}
        </template>
      </Column>
      <Column
        v-if="isVisible('category.name')"
        field="category.name"
        header="Category"
      >
        <template #body="{ data }">
          {{ data.category?.name || "-" }}
        </template>
      </Column>
      <Column v-if="isVisible('brand.name')" field="brand.name" header="Brand">
        <template #body="{ data }">
          {{ data.brand?.name || "-" }}
        </template>
      </Column>
      <Column
        v-if="isVisible('vendor.business_name')"
        field="vendor.business_name"
        header="Vendor"
      >
        <template #body="{ data }">
          {{ data.vendor?.business_name || "-" }}
        </template>
      </Column>
      <Column
        v-if="isVisible('created_at')"
        field="created_at"
        header="Created At"
        sortable
      >
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>
      <Column header="Actions" class="w-24">
        <template #body="{ data }">
          <NuxtLink :to="`/products/${data.id}`">
            <Button icon="pi pi-eye" severity="info" text rounded />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>

    <!-- Paginator -->
    <Paginator
      :rows="productStore.pagination.per_page"
      :total-records="productStore.pagination.total"
      :first="
        (productStore.pagination.current_page - 1) *
        productStore.pagination.per_page
      "
      @page="onPageChange"
    />
  </div>
</template>
