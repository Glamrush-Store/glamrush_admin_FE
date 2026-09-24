<script setup>
import { useToast } from "primevue/usetoast";
import {
  CONTACT_SUBMISSION_PERMISSIONS,
  CONTACT_SUBMISSION_STATUS_OPTIONS,
  contactSubmissionStatusLabel,
  contactSubmissionStatusSeverity,
  formatContactSubmissionDate,
} from "~/constants/contactSubmissions";
import { useContactSubmissionStore } from "~/stores/contactSubmission";

const store = useContactSubmissionStore();
const toast = useToast();
const { can } = usePermissions();

const detailsVisible = ref(false);
const draftFilters = reactive({
  search: "",
  status: null,
  source: "",
  date_from: null,
  date_to: null,
});

const canList = computed(() => can(CONTACT_SUBMISSION_PERMISSIONS.list));
const canView = computed(() => can(CONTACT_SUBMISSION_PERMISSIONS.view));
const canUpdate = computed(() => can(CONTACT_SUBMISSION_PERMISSIONS.update));
const hasFilters = computed(() => Object.values(draftFilters).some(Boolean));

let searchTimeout = null;

function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 450);
}

async function applyFilters() {
  await store.applyFilters({ ...draftFilters });
}

async function clearFilters() {
  Object.assign(draftFilters, {
    search: "",
    status: null,
    source: "",
    date_from: null,
    date_to: null,
  });
  await store.resetFilters();
}

function onPageChange(event) {
  store.setPage(event.page + 1, event.rows);
}

function onSort(event) {
  store.setSorting(event.sortField || "created_at", event.sortOrder === 1 ? "asc" : "desc");
}

async function openDetails(submission) {
  if (!canView.value) return;
  detailsVisible.value = true;
  await store.fetchSubmission(submission.id);
}

async function updateStatus({ id, status }) {
  try {
    const response = await store.updateSubmissionStatus(id, status);
    toast.add({
      severity: "success",
      summary: "Status updated",
      detail: response.message || "Contact submission status has been updated.",
      life: 3500,
    });
    await Promise.all([store.fetchSubmission(id), store.fetchSubmissions()]);
  } catch (exception) {
    toast.add({
      severity: exception.status === 403 ? "warn" : "error",
      summary: exception.status === 403 ? "Permission required" : "Status update failed",
      detail: exception.status === 403
        ? "You do not have permission to update contact submissions."
        : exception.message || "Unable to update the contact submission status.",
      life: 5000,
    });
  }
}

onMounted(() => {
  if (canList.value) {
    store.fetchSubmissions();
  }
});

onUnmounted(() => {
  clearTimeout(searchTimeout);
});
</script>

<template>
  <div>
    <Toast />

    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="mb-1 flex items-center gap-2 text-sm text-slate-500">
          <NuxtLink to="/customers" class="text-slate-500 no-underline hover:text-primary hover:underline">
            Customers
          </NuxtLink>
          <i class="pi pi-chevron-right text-xs" />
          <span>Contact submissions</span>
        </div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Contact submissions</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500">
          Review customer and guest storefront messages, then triage them by status.
        </p>
      </div>
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :loading="store.loading"
        :disabled="!canList"
        @click="store.fetchSubmissions"
      />
    </div>

    <Message
      v-if="!canList || store.permissionDenied"
      severity="warn"
      :closable="false"
      class="mb-4"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-lock mt-1" />
        <div>
          <p class="m-0 font-semibold">Contact submission access is restricted</p>
          <p class="mb-0 mt-1 text-sm">
            Ask a super administrator for the ViewAny_ContactSubmission permission.
          </p>
        </div>
      </div>
    </Message>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Search</label>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="draftFilters.search"
              placeholder="Name, email, subject..."
              class="w-72 max-w-full"
              @input="onSearchInput"
              @keyup.enter="applyFilters"
            />
          </IconField>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Status</label>
          <Select
            v-model="draftFilters.status"
            :options="CONTACT_SUBMISSION_STATUS_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="All statuses"
            show-clear
            class="w-48"
            @update:model-value="applyFilters"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">Source</label>
          <InputText
            v-model="draftFilters.source"
            placeholder="Source..."
            class="w-48"
            @keyup.enter="applyFilters"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">From</label>
          <DatePicker
            v-model="draftFilters.date_from"
            date-format="yy-mm-dd"
            placeholder="Start date"
            class="w-44"
            :max-date="draftFilters.date_to || undefined"
            @update:model-value="applyFilters"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">To</label>
          <DatePicker
            v-model="draftFilters.date_to"
            date-format="yy-mm-dd"
            placeholder="End date"
            class="w-44"
            :min-date="draftFilters.date_from || undefined"
            @update:model-value="applyFilters"
          />
        </div>

        <Button
          label="Apply"
          icon="pi pi-filter"
          :loading="store.loading"
          @click="applyFilters"
        />
        <Button
          label="Clear"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          :disabled="!hasFilters"
          @click="clearFilters"
        />
      </div>

      <Message
        v-if="store.error"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span>{{ store.error }}</span>
          <Button
            label="Retry"
            icon="pi pi-refresh"
            severity="danger"
            text
            size="small"
            @click="store.fetchSubmissions"
          />
        </div>
      </Message>

      <DataTable
        :value="store.submissions"
        :loading="store.loading"
        lazy
        striped-rows
        removable-sort
        sort-mode="single"
        :total-records="store.pagination.total"
        :sort-field="store.sorting.sort_by"
        :sort-order="store.sorting.sort_dir === 'asc' ? 1 : -1"
        class="mb-4"
        @sort="onSort"
      >
        <template #empty>
          <div class="flex flex-col items-center px-5 py-12 text-center text-slate-500">
            <i class="pi pi-inbox mb-3 text-3xl" />
            <p class="m-0 font-medium text-slate-800">No contact submissions found</p>
            <p class="mb-0 mt-1 text-sm">New storefront messages will appear here.</p>
          </div>
        </template>

        <Column field="created_at" header="Received" sortable>
          <template #body="{ data }">
            <span class="whitespace-nowrap">{{ formatContactSubmissionDate(data.created_at) }}</span>
          </template>
        </Column>

        <Column field="name" header="Contact" sortable>
          <template #body="{ data }">
            <div class="min-w-48">
              <button
                v-if="canView"
                type="button"
                class="border-0 bg-transparent p-0 text-left font-semibold text-slate-950 hover:text-primary hover:underline"
                @click="openDetails(data)"
              >
                {{ data.name || "Guest" }}
              </button>
              <p v-else class="m-0 font-semibold text-slate-950">{{ data.name || "Guest" }}</p>
              <p class="mb-0 mt-1 break-all text-xs text-slate-500">{{ data.email || "-" }}</p>
              <p v-if="data.phone" class="mb-0 mt-1 text-xs text-slate-500">{{ data.phone }}</p>
            </div>
          </template>
        </Column>

        <Column field="subject" header="Subject" sortable>
          <template #body="{ data }">
            <div class="max-w-80">
              <p class="m-0 truncate font-medium text-slate-900" :title="data.subject || 'No subject'">
                {{ data.subject || "No subject" }}
              </p>
              <p class="mb-0 mt-1 text-xs text-slate-500">{{ data.customer ? "Customer account" : "Guest" }}</p>
            </div>
          </template>
        </Column>

        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag
              :value="contactSubmissionStatusLabel(data.status)"
              :severity="contactSubmissionStatusSeverity(data.status)"
            />
          </template>
        </Column>

        <Column header="Storefront">
          <template #body="{ data }">
            <div>
              <p class="m-0 text-sm font-medium text-slate-900">{{ data.storefront?.name || "-" }}</p>
              <p v-if="data.storefront?.slug" class="mb-0 mt-1 text-xs text-slate-500">{{ data.storefront.slug }}</p>
            </div>
          </template>
        </Column>

        <Column field="source" header="Source" sortable>
          <template #body="{ data }">
            <span class="text-sm text-slate-700">{{ data.source || "-" }}</span>
          </template>
        </Column>

        <Column field="resolved_at" header="Resolved" sortable>
          <template #body="{ data }">
            <span class="whitespace-nowrap">{{ formatContactSubmissionDate(data.resolved_at) }}</span>
          </template>
        </Column>

        <Column header="Actions" class="w-24">
          <template #body="{ data }">
            <Button
              v-if="canView"
              icon="pi pi-eye"
              severity="info"
              text
              rounded
              aria-label="View contact submission"
              @click="openDetails(data)"
            />
            <span v-else class="text-xs text-slate-500">No access</span>
          </template>
        </Column>
      </DataTable>

      <Paginator
        :rows="store.pagination.per_page"
        :total-records="store.pagination.total"
        :first="(store.pagination.current_page - 1) * store.pagination.per_page"
        :rows-per-page-options="[15, 30, 50, 100]"
        @page="onPageChange"
      />
    </template>

    <ContactSubmissionsContactSubmissionDetailsDialog
      v-model:visible="detailsVisible"
      :submission="store.selectedSubmission"
      :loading="store.detailsLoading"
      :error="store.detailsError"
      :can-update="canUpdate"
      :status-loading="store.statusLoading"
      @update-status="updateStatus"
    />
  </div>
</template>

