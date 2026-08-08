<script setup>
import { useVendorStore } from "~/stores/vendor";

const vendorStore = useVendorStore();

const searchInput = ref("");
let searchTimeout = null;

const isActiveOptions = [
  { label: "All", value: null },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 0 },
];

function onSearchInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    vendorStore.setFilter("search", val);
  }, 400);
}

function onIsActiveChange(val) {
  vendorStore.setFilter("is_active", val);
}

function clearFilters() {
  searchInput.value = "";
  vendorStore.resetFilters();
}

function onSort(event) {
  const order = event.sortOrder === 1 ? "asc" : "desc";
  vendorStore.setSorting(event.sortField, order);
}

function onPageChange(event) {
  vendorStore.setPage(event.page + 1);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

onMounted(() => {
  vendorStore.fetchVendors();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Vendors</h1>
      <NuxtLink to="/vendors/create">
        <Button label="Add New Vendor" icon="pi pi-plus" />
      </NuxtLink>
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
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="vendorStore.filters.is_active"
          :options="isActiveOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-40"
          @update:model-value="onIsActiveChange"
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
      :value="vendorStore.vendors"
      :loading="vendorStore.loading"
      lazy
      :total-records="vendorStore.pagination.total"
      @sort="onSort"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
    >
      <Column field="business_name" header="Business Name" sortable />
      <Column field="name" header="Name" sortable />
      <Column field="city" header="City" />
      <Column field="state" header="State" />
      <Column field="country" header="Country" />
      <Column field="is_active" header="Is Active">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Active' : 'Inactive'"
            :severity="data.is_active ? 'success' : 'danger'"
          />
        </template>
      </Column>
      <Column field="created_at" header="Created At" sortable>
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>
      <Column header="Actions" class="w-24">
        <template #body="{ data }">
          <NuxtLink :to="`/vendors/${data.id}`">
            <Button icon="pi pi-eye" severity="info" text rounded />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>

    <!-- Paginator -->
    <Paginator
      :rows="vendorStore.pagination.per_page"
      :total-records="vendorStore.pagination.total"
      :first="
        (vendorStore.pagination.current_page - 1) *
        vendorStore.pagination.per_page
      "
      @page="onPageChange"
    />
  </div>
</template>
