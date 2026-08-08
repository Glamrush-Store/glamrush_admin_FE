<script setup>
import { useShippingZoneStore } from "~/stores/shippingZone";
import { ApiError } from "~/composables/apiClient";

const zoneStore = useShippingZoneStore();
const confirm = useConfirm();
const toast = useToast();

const nameInput = ref("");
let searchTimeout = null;

const isActiveOptions = [
  { label: "All", value: null },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 0 },
];

function onNameInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => zoneStore.setFilter("name", val), 400);
}

function onIsActiveChange(val) {
  zoneStore.setFilter("is_active", val);
}

function clearFilters() {
  nameInput.value = "";
  zoneStore.resetFilters();
}

function onSort(event) {
  zoneStore.setSorting(event.sortField, event.sortOrder === 1 ? "asc" : "desc");
}

function onPageChange(event) {
  zoneStore.setPage(event.page + 1);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function confirmDelete(zone) {
  confirm.require({
    message: `Are you sure you want to delete "${zone.name}"?`,
    header: "Delete Zone",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await zoneStore.deleteZone(zone.id);
        toast.add({ severity: "success", summary: "Deleted", detail: `"${zone.name}" has been deleted`, life: 3000 });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Failed to delete zone";
        toast.add({ severity: "error", summary: "Error", detail: msg, life: 4000 });
      }
    },
  });
}

onMounted(() => zoneStore.fetchZones());
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Shipping Zones</h1>
      <NuxtLink to="/shipping/zones/create">
        <Button label="Add New Zone" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Name</label>
        <InputText
          v-model="nameInput"
          placeholder="Search by name..."
          class="w-48"
          @input="onNameInput(nameInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Country</label>
        <InputText
          :model-value="zoneStore.filters.country"
          placeholder="e.g. NG"
          class="w-28"
          @update:model-value="zoneStore.setFilter('country', $event)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="zoneStore.filters.is_active"
          :options="isActiveOptions"
          option-label="label"
          option-value="value"
          placeholder="All"
          class="w-36"
          @update:model-value="onIsActiveChange"
        />
      </div>

      <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
    </div>

    <DataTable
      :value="zoneStore.zones"
      :loading="zoneStore.loading"
      lazy
      :total-records="zoneStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <Column field="name" header="Name" sortable />
      <Column field="country" header="Country" />
      <Column field="state" header="State">
        <template #body="{ data }">{{ data.state ?? "-" }}</template>
      </Column>
      <Column field="city" header="City">
        <template #body="{ data }">{{ data.city ?? "-" }}</template>
      </Column>
      <Column field="is_active" header="Status">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column field="created_at" header="Created" sortable>
        <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
      </Column>
      <Column header="Actions" class="w-28">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <NuxtLink :to="`/shipping/zones/${data.id}/edit`">
              <Button icon="pi pi-pencil" severity="secondary" text rounded />
            </NuxtLink>
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="zoneStore.pagination.per_page"
      :total-records="zoneStore.pagination.total"
      :first="(zoneStore.pagination.current_page - 1) * zoneStore.pagination.per_page"
      @page="onPageChange"
    />
  </div>
</template>
