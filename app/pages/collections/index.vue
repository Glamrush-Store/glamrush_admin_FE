<script setup>
import { useCollectionStore } from "~/stores/collection";

const collectionStore = useCollectionStore();

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
    collectionStore.setFilter("search", val);
  }, 400);
}

function onIsActiveChange(val) {
  collectionStore.setFilter("is_active", val);
}

function clearFilters() {
  searchInput.value = "";
  collectionStore.resetFilters();
}

function onSort(event) {
  const order = event.sortOrder === 1 ? "asc" : "desc";
  collectionStore.setSorting(event.sortField, order);
}

function onPageChange(event) {
  collectionStore.setPage(event.page + 1);
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
  collectionStore.fetchCollections();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Collections</h1>
      <NuxtLink to="/collections/create">
        <Button label="Add New Collection" icon="pi pi-plus" />
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
          :model-value="collectionStore.filters.is_active"
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
      :value="collectionStore.collections"
      :loading="collectionStore.loading"
      lazy
      :total-records="collectionStore.pagination.total"
      @sort="onSort"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
    >
      <Column field="name" header="Name" sortable />
      <Column field="slug" header="Slug" />
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
          <NuxtLink :to="`/collections/${data.id}`">
            <Button icon="pi pi-eye" severity="info" text rounded />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>

    <!-- Paginator -->
    <Paginator
      :rows="collectionStore.pagination.per_page"
      :total-records="collectionStore.pagination.total"
      :first="
        (collectionStore.pagination.current_page - 1) *
        collectionStore.pagination.per_page
      "
      @page="onPageChange"
    />
  </div>
</template>
