<script setup>
import {
  PAYMENT_PROVIDER_OPTIONS,
  PAYMENT_TRANSACTION_STATUS_OPTIONS,
  PAYMENT_TRANSACTION_STATUS_SEVERITY,
  PAYMENT_TRANSACTION_TYPE_OPTIONS,
  humanizePaymentTransactionStatus,
} from "~/constants/paymentTransactions";
import { usePaymentTransactionStore } from "~/stores/paymentTransaction";

const transactionStore = usePaymentTransactionStore();
const { can } = usePermissions();

const searchInput = ref("");
const dateRange = ref(null);
const selectedTransaction = ref(null);
const payloadDialogVisible = ref(false);
let searchTimeout = null;

function onSearchInput(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => transactionStore.setFilter("search", value), 400);
}

function formatDateValue(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

function onDateChange(value) {
  if (value && value.length === 2 && value[0] && value[1]) {
    transactionStore.setFilters({
      date_from: formatDateValue(value[0]),
      date_to: formatDateValue(value[1]),
    });
    return;
  }

  if (!value || value.length === 0) {
    transactionStore.setFilters({ date_from: null, date_to: null });
  }
}

function clearFilters() {
  searchInput.value = "";
  dateRange.value = null;
  transactionStore.resetFilters();
}

function onSort(event) {
  transactionStore.setSorting(event.sortField || "created_at", event.sortOrder === 1 ? "asc" : "desc");
}

function onPageChange(event) {
  transactionStore.setPage(event.page + 1);
}

function formatMoney(value, currency = "NGN") {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function paymentReference(transaction) {
  return transaction.payment?.reference || transaction.payment?.transaction_id || transaction.provider_reference || "-";
}

function providerLabel(transaction) {
  return transaction.payment_method?.name || humanizePaymentTransactionStatus(transaction.payment?.provider);
}

function showPayload(transaction) {
  selectedTransaction.value = transaction;
  payloadDialogVisible.value = true;
}

const formattedPayload = computed(() => {
  if (!selectedTransaction.value?.payload) return "No payload recorded.";
  return JSON.stringify(selectedTransaction.value.payload, null, 2);
});

onMounted(() => {
  transactionStore.fetchTransactions();
});

onUnmounted(() => {
  clearTimeout(searchTimeout);
});
</script>

<template>
  <div>
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 m-0">Payment Transactions</h1>
        <p class="text-sm text-slate-500 mt-1 mb-0">Review gateway and offline payment transaction records.</p>
      </div>
      <Button
        icon="pi pi-refresh"
        label="Refresh"
        severity="secondary"
        outlined
        :loading="transactionStore.loading"
        @click="transactionStore.fetchTransactions"
      />
    </div>

    <Message v-if="!can('View_PaymentTransaction')" severity="warn" class="mb-4">
      You do not have permission to view payment transactions.
    </Message>

    <Message v-if="transactionStore.error" severity="error" class="mb-4">
      {{ transactionStore.error }}
    </Message>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Search</label>
        <InputText
          v-model="searchInput"
          placeholder="Reference, transaction, order number..."
          class="w-80 max-w-full"
          @input="onSearchInput(searchInput)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Status</label>
        <Select
          :model-value="transactionStore.filters.status"
          :options="PAYMENT_TRANSACTION_STATUS_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="All statuses"
          show-clear
          class="w-48"
          @update:model-value="transactionStore.setFilter('status', $event)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Type</label>
        <Select
          :model-value="transactionStore.filters.type"
          :options="PAYMENT_TRANSACTION_TYPE_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="All types"
          show-clear
          class="w-44"
          @update:model-value="transactionStore.setFilter('type', $event)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">Provider</label>
        <Select
          :model-value="transactionStore.filters.provider"
          :options="PAYMENT_PROVIDER_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="All providers"
          show-clear
          class="w-48"
          @update:model-value="transactionStore.setFilter('provider', $event)"
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

      <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
    </div>

    <DataTable
      :value="transactionStore.transactions"
      :loading="transactionStore.loading"
      lazy
      :total-records="transactionStore.pagination.total"
      sort-mode="single"
      removable-sort
      striped-rows
      class="mb-4"
      @sort="onSort"
    >
      <template #empty>
        <div class="py-8 text-center text-sm text-slate-500">No payment transactions found.</div>
      </template>

      <Column field="created_at" header="Date" sortable>
        <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
      </Column>
      <Column header="Order">
        <template #body="{ data }">
          <NuxtLink v-if="data.order?.id" :to="`/orders/${data.order.id}`" class="font-semibold text-primary no-underline">
            {{ data.order.order_number }}
          </NuxtLink>
          <span v-else>-</span>
        </template>
      </Column>
      <Column header="Provider">
        <template #body="{ data }">{{ providerLabel(data) }}</template>
      </Column>
      <Column header="Reference">
        <template #body="{ data }">
          <span class="block max-w-64 truncate" :title="paymentReference(data)">{{ paymentReference(data) }}</span>
        </template>
      </Column>
      <Column field="type" header="Type" sortable>
        <template #body="{ data }">{{ humanizePaymentTransactionStatus(data.type) }}</template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <Tag
            :value="humanizePaymentTransactionStatus(data.status)"
            :severity="PAYMENT_TRANSACTION_STATUS_SEVERITY[data.status] || 'secondary'"
          />
        </template>
      </Column>
      <Column field="amount" header="Amount" sortable>
        <template #body="{ data }">{{ formatMoney(data.amount, data.currency) }}</template>
      </Column>
      <Column header="Payment">
        <template #body="{ data }">
          <div class="text-sm">
            <p class="m-0 font-medium">{{ humanizePaymentTransactionStatus(data.payment?.status) }}</p>
            <p class="m-0 text-xs opacity-80">{{ data.payment?.id || "-" }}</p>
          </div>
        </template>
      </Column>
      <Column header="Actions" class="w-24">
        <template #body="{ data }">
          <Button
            icon="pi pi-code"
            severity="info"
            text
            rounded
            aria-label="View payload"
            :disabled="!data.payload"
            @click="showPayload(data)"
          />
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="transactionStore.pagination.per_page"
      :total-records="transactionStore.pagination.total"
      :first="(transactionStore.pagination.current_page - 1) * transactionStore.pagination.per_page"
      @page="onPageChange"
    />

    <Dialog v-model:visible="payloadDialogVisible" modal header="Transaction Payload" class="w-[90vw] md:w-[720px]">
      <div class="mb-3 text-sm text-slate-600">
        <p class="m-0">Transaction: {{ selectedTransaction?.id || "-" }}</p>
        <p class="m-0">Reference: {{ selectedTransaction ? paymentReference(selectedTransaction) : "-" }}</p>
      </div>
      <pre class="max-h-[60vh] overflow-auto rounded-md bg-slate-950 p-4 text-sm text-white whitespace-pre-wrap">{{ formattedPayload }}</pre>
    </Dialog>
  </div>
</template>
