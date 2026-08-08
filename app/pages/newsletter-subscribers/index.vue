<script setup>
import { useToast } from "primevue/usetoast";
import { useNewsletterSubscriberStore } from "~/stores/newsletterSubscriber";

const subscriberStore = useNewsletterSubscriberStore();
const toast = useToast();
const detailsVisible = ref(false);
const draftFilters = reactive({
  search: "",
  status: null,
  source: "",
  confirmed_from: null,
  confirmed_to: null,
});

const statusOptions = [
  { label: "All", value: null },
  { label: "Pending", value: "pending" },
  { label: "Subscribed", value: "subscribed" },
  { label: "Unsubscribed", value: "unsubscribed" },
];

const hasFilters = computed(() => Object.values(draftFilters).some(Boolean));

function statusSeverity(status) {
  return { subscribed: "success", pending: "warn", unsubscribed: "secondary" }[status] || "info";
}

function formatDate(value, includeTime = false) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(value));
}

async function applyFilters() {
  await subscriberStore.applyFilters({ ...draftFilters });
}

async function clearFilters() {
  Object.assign(draftFilters, {
    search: "",
    status: null,
    source: "",
    confirmed_from: null,
    confirmed_to: null,
  });
  await subscriberStore.resetFilters();
}

function onPageChange(event) {
  subscriberStore.setPage(event.page + 1, event.rows);
}

function onSort(event) {
  subscriberStore.setSorting(event.sortField, event.sortOrder === 1 ? "asc" : "desc");
}

async function openDetails(subscriber) {
  detailsVisible.value = true;
  await subscriberStore.fetchSubscriber(subscriber.id);
}

async function exportCsv() {
  try {
    const filename = await subscriberStore.exportSubscribers();
    toast.add({
      severity: "success",
      summary: "Export ready",
      detail: `${filename} has been downloaded.`,
      life: 3500,
    });
  } catch (exception) {
    toast.add({
      severity: exception.status === 403 ? "warn" : "error",
      summary: exception.status === 403 ? "Export permission required" : "Export failed",
      detail: exception.message,
      life: 5000,
    });
  }
}

onMounted(() => subscriberStore.fetchSubscribers());
</script>

<template>
  <div>
    <Toast />

    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold text-slate-900">Newsletter Subscribers</h1>
      <Button
        label="Export CSV"
        icon="pi pi-download"
        :loading="subscriberStore.exporting"
        @click="exportCsv"
      />
    </div>

    <Message
      v-if="subscriberStore.permissionDenied"
      severity="warn"
      :closable="false"
      class="mb-4"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-lock mt-1" />
        <div>
          <p class="m-0 font-semibold">Newsletter access is restricted</p>
          <p class="mb-0 mt-1 text-sm">
            Ask a super administrator for the ViewAny_NewsletterSubscriber permission.
          </p>
        </div>
      </div>
    </Message>

    <template v-else>
      <div class="flex flex-wrap items-end gap-3 mb-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Email</label>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="draftFilters.search"
              placeholder="Search email..."
              class="w-64"
              @keyup.enter="applyFilters"
            />
          </IconField>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Status</label>
          <Select
            v-model="draftFilters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="All"
            class="w-44"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Source</label>
          <InputText
            v-model="draftFilters.source"
            placeholder="Source..."
            class="w-56"
            @keyup.enter="applyFilters"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Confirmed From</label>
          <DatePicker
            v-model="draftFilters.confirmed_from"
            date-format="yy-mm-dd"
            placeholder="Start date"
            class="w-44"
            :max-date="draftFilters.confirmed_to || undefined"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Confirmed To</label>
          <DatePicker
            v-model="draftFilters.confirmed_to"
            date-format="yy-mm-dd"
            placeholder="End date"
            class="w-44"
            :min-date="draftFilters.confirmed_from || undefined"
          />
        </div>

        <Button
          label="Apply"
          icon="pi pi-filter"
          :loading="subscriberStore.loading"
          @click="applyFilters"
        />
        <Button
          label="Clear Filters"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          :disabled="!hasFilters"
          @click="clearFilters"
        />
      </div>

      <Message
        v-if="subscriberStore.error"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        <div class="flex items-center justify-between gap-4">
          <span>{{ subscriberStore.error }}</span>
          <Button
            label="Retry"
            icon="pi pi-refresh"
            severity="danger"
            text
            size="small"
            @click="subscriberStore.fetchSubscribers"
          />
        </div>
      </Message>

      <DataTable
        :value="subscriberStore.subscribers"
        :loading="subscriberStore.loading"
        lazy
        striped-rows
        removable-sort
        sort-mode="single"
        :total-records="subscriberStore.pagination.total"
        :sort-field="subscriberStore.sorting.sort_by"
        :sort-order="subscriberStore.sorting.sort_dir === 'asc' ? 1 : -1"
        class="mb-4"
        @sort="onSort"
      >
        <template #empty>
          <div class="flex flex-col items-center px-5 py-12 text-center text-slate-500">
            <i class="pi pi-envelope text-3xl mb-3" />
            <p class="m-0 font-medium text-slate-800">No subscribers found</p>
            <p class="mb-0 mt-1 text-sm">Try clearing filters or widening the date range.</p>
          </div>
        </template>

        <Column field="email" header="Subscriber" sortable>
          <template #body="{ data }">
            <button
              type="button"
              class="p-0 border-0 bg-transparent text-left font-medium text-slate-900 cursor-pointer hover:text-primary-600 hover:underline"
              @click="openDetails(data)"
            >
              {{ data.email }}
            </button>
          </template>
        </Column>
        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.status || '-'"
              :severity="statusSeverity(data.status)"
              class="capitalize"
            />
          </template>
        </Column>
        <Column field="source" header="Source" sortable>
          <template #body="{ data }">
            <span class="text-sm text-slate-700">{{ data.source || "-" }}</span>
          </template>
        </Column>
        <Column field="confirmed_at" header="Confirmed" sortable>
          <template #body="{ data }">
            {{ formatDate(data.confirmed_at) }}
          </template>
        </Column>
        <Column field="created_at" header="Added" sortable>
          <template #body="{ data }">
            {{ formatDate(data.created_at) }}
          </template>
        </Column>
        <Column header="Actions" class="w-24">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              severity="info"
              text
              rounded
              aria-label="View subscriber"
              @click="openDetails(data)"
            />
          </template>
        </Column>
      </DataTable>

      <Paginator
        :rows="subscriberStore.pagination.per_page"
        :total-records="subscriberStore.pagination.total"
        :first="(subscriberStore.pagination.current_page - 1) * subscriberStore.pagination.per_page"
        :rows-per-page-options="[15, 30, 50, 100]"
        @page="onPageChange"
      />
    </template>

    <Dialog
      v-model:visible="detailsVisible"
      modal
      header="Subscriber Details"
      :style="{ width: '34rem' }"
      :breakpoints="{ '640px': '94vw' }"
    >
      <div
        v-if="subscriberStore.detailsLoading"
        class="flex items-center justify-center py-12"
      >
        <ProgressSpinner style="width: 38px; height: 38px" stroke-width="4" />
      </div>

      <Message
        v-else-if="subscriberStore.detailsError"
        severity="error"
        :closable="false"
      >
        {{ subscriberStore.detailsError }}
      </Message>

      <div v-else-if="subscriberStore.selectedSubscriber">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <span class="text-sm text-slate-500">Email</span>
            <p class="m-0 break-all text-lg font-semibold text-slate-900">
              {{ subscriberStore.selectedSubscriber.email }}
            </p>
          </div>
          <Tag
            :value="subscriberStore.selectedSubscriber.status"
            :severity="statusSeverity(subscriberStore.selectedSubscriber.status)"
            class="capitalize"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Source</span>
            <p class="font-medium text-slate-900">
              {{ subscriberStore.selectedSubscriber.source || "-" }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Consented</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(subscriberStore.selectedSubscriber.consented_at, true) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Confirmed</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(subscriberStore.selectedSubscriber.confirmed_at, true) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Unsubscribed</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(subscriberStore.selectedSubscriber.unsubscribed_at, true) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Created</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(subscriberStore.selectedSubscriber.created_at, true) }}
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Last Updated</span>
            <p class="font-medium text-slate-900">
              {{ formatDate(subscriberStore.selectedSubscriber.updated_at, true) }}
            </p>
          </div>
        </div>

        <Message severity="info" :closable="false" class="mt-6">
          Status is read-only and follows the subscriber's verified storefront consent lifecycle.
        </Message>
      </div>
    </Dialog>
  </div>
</template>
