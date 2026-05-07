<script setup>
import { useCategoryStore } from "~/stores/category";

const categoryStore = useCategoryStore();

const searchInput = ref("");
let searchTimeout = null;

const isActiveOptions = [
  { label: "All", value: null },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 0 },
];

const isParentOptions = [
  { label: "All", value: null },
  { label: "Top-level", value: 1 },
  { label: "Has Parent", value: 0 },
];

function onSearchInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    categoryStore.setFilter("search", val);
  }, 400);
}

function onIsActiveChange(val) {
  categoryStore.setFilter("is_active", val);
}

function onIsParentChange(val) {
  categoryStore.setFilter("is_parent", val);
}

function clearFilters() {
  searchInput.value = "";
  categoryStore.resetFilters();
}

function onSort(event) {
  const order = event.sortOrder === 1 ? "asc" : "desc";
  categoryStore.setSorting(event.sortField, order);
}

function onPageChange(event) {
  categoryStore.setPage(event.page + 1);
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
  categoryStore.fetchCategories();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Categories</h1>
      <NuxtLink to="/categories/create">
        <Button label="Add New Category" icon="pi pi-plus" />
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
          :model-value="categoryStore.filters.is_active"
          :options="isActiveOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-40"
          @update:model-value="onIsActiveChange"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Parent</label>
        <Select
          :model-value="categoryStore.filters.is_parent"
          :options="isParentOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-40"
          @update:model-value="onIsParentChange"
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
      :value="categoryStore.categories"
      :loading="categoryStore.loading"
      lazy
      :total-records="categoryStore.pagination.total"
      @sort="onSort"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
    >
      <Column field="name" header="Name" sortable />
      <Column field="slug" header="Slug" />
      <Column field="parent_name" header="Parent">
        <template #body="{ data }">
          {{ data.parent_name || "\u2014" }}
        </template>
      </Column>
      <Column field="sort_order" header="Sort Order" sortable>
        <template #body="{ data }">
          {{ data.sort_order != null ? data.sort_order : "-" }}
        </template>
      </Column>
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
          <NuxtLink :to="`/categories/${data.id}`">
            <Button icon="pi pi-eye" severity="info" text rounded />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>

    <!-- Paginator -->
    <Paginator
      :rows="categoryStore.pagination.per_page"
      :total-records="categoryStore.pagination.total"
      :first="
        (categoryStore.pagination.current_page - 1) *
        categoryStore.pagination.per_page
      "
      @page="onPageChange"
    />
  </div>
</template>
