<script setup>
import { usePaymentMethodStore } from "~/stores/paymentMethod";
import { ApiError } from "~/composables/apiClient";

const store = usePaymentMethodStore();
const confirm = useConfirm();
const toast = useToast();

function confirmDelete(item) {
  confirm.require({
    message: `Are you sure you want to delete "${item.name}"?`,
    header: "Delete Payment Method",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", text: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      try {
        await store.deletePaymentMethod(item.id);
        toast.add({ severity: "success", summary: "Deleted", detail: `"${item.name}" has been deleted`, life: 3000 });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Failed to delete payment method";
        toast.add({ severity: "error", summary: "Error", detail: msg, life: 4000 });
      }
    },
  });
}

onMounted(() => store.fetchPaymentMethods());
</script>

<template>
  <div>
    <ConfirmDialog />
    <Toast />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Payment Methods</h1>
      <NuxtLink to="/settings/payment-methods/create">
        <Button label="Add New" icon="pi pi-plus" />
      </NuxtLink>
    </div>

    <DataTable :value="store.methods" :loading="store.loading" striped-rows>
      <Column field="name" header="Name" />
      <Column field="code" header="Code">
        <template #body="{ data }">
          <span class="font-mono text-sm text-slate-600">{{ data.code }}</span>
        </template>
      </Column>
      <Column field="description" header="Description" />
      <Column header="Channels">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag
              v-for="channel in data.public_config?.channels"
              :key="channel"
              :value="channel"
              severity="secondary"
            />
          </div>
        </template>
      </Column>
      <Column field="is_active" header="Active">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Active' : 'Inactive'"
            :severity="data.is_active ? 'success' : 'danger'"
          />
        </template>
      </Column>
      <Column header="Actions" class="w-28">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <NuxtLink :to="`/settings/payment-methods/${data.id}/edit`">
              <Button icon="pi pi-pencil" severity="secondary" text rounded />
            </NuxtLink>
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
