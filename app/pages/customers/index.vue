<script setup>
import { useCustomerStore } from "~/stores/customer";

const customerStore = useCustomerStore();

const searchInput = ref("");
let searchTimeout = null;

function onSearchInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    customerStore.setFilter("search", val);
  }, 400);
}

function clearFilters() {
  searchInput.value = "";
  customerStore.resetFilters();
}

function onSort(event) {
  const order = event.sortOrder === 1 ? "asc" : "desc";
  customerStore.setSorting(event.sortField, order);
}

function onPageChange(event) {
  customerStore.setPage(event.page + 1);
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
  customerStore.fetchCustomers();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Customers</h1>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Search</label>
        <InputText
          v-model="searchInput"
          placeholder="Search by name or email..."
          class="w-64"
          @input="onSearchInput(searchInput)"
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
      :value="customerStore.customers"
      :loading="customerStore.loading"
      lazy
      :total-records="customerStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <Column field="name" header="Name" sortable />
      <Column field="email" header="Email" sortable />
      <Column field="phone" header="Phone" />
      <Column field="created_at" header="Registered" sortable>
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>
    </DataTable>

    <!-- Paginator -->
    <Paginator
      :rows="customerStore.pagination.per_page"
      :total-records="customerStore.pagination.total"
      :first="(customerStore.pagination.current_page - 1) * customerStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
