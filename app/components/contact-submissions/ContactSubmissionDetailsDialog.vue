<script setup>
import {
  CONTACT_SUBMISSION_STATUS_OPTIONS,
  contactSubmissionStatusLabel,
  contactSubmissionStatusSeverity,
  formatContactSubmissionDate,
} from "~/constants/contactSubmissions";

const props = defineProps({
  visible: { type: Boolean, default: false },
  submission: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  canUpdate: { type: Boolean, default: false },
  statusLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:visible", "update-status"]);

const statusDraft = ref(null);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const messageBody = computed(() => {
  if (!props.submission) return "";
  return props.submission.message || props.submission.body || props.submission.content || "";
});

const customerLabel = computed(() => {
  if (!props.submission?.customer) return "Guest submission";
  return `${props.submission.customer.name || "Customer"} #${props.submission.customer.id}`;
});

watch(
  () => props.submission?.status,
  (status) => {
    statusDraft.value = status || null;
  },
  { immediate: true }
);

function closeDialog() {
  emit("update:visible", false);
}

function submitStatusUpdate() {
  if (!props.submission?.id || !statusDraft.value || statusDraft.value === props.submission.status) return;
  emit("update-status", {
    id: props.submission.id,
    status: statusDraft.value,
  });
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Contact submission"
    class="w-[94vw] md:w-[760px]"
    :breakpoints="{ '640px': '96vw' }"
  >
    <div
      v-if="loading"
      class="flex items-center justify-center py-12"
    >
      <ProgressSpinner style="width: 38px; height: 38px" stroke-width="4" />
    </div>

    <Message
      v-else-if="error"
      severity="error"
      :closable="false"
    >
      {{ error }}
    </Message>

    <div v-else-if="submission" class="flex flex-col gap-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="min-w-0">
          <p class="m-0 text-sm text-slate-500">Subject</p>
          <h2 class="m-0 break-words text-xl font-semibold text-slate-950">
            {{ submission.subject || "No subject" }}
          </h2>
          <p class="mb-0 mt-2 text-sm text-slate-500">
            Received {{ formatContactSubmissionDate(submission.created_at) }}
          </p>
        </div>
        <Tag
          :value="contactSubmissionStatusLabel(submission.status)"
          :severity="contactSubmissionStatusSeverity(submission.status)"
        />
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <span class="text-xs uppercase tracking-wide text-slate-500">Name</span>
            <p class="mb-0 mt-1 font-semibold text-slate-950">{{ submission.name || "-" }}</p>
          </div>
          <div>
            <span class="text-xs uppercase tracking-wide text-slate-500">Email</span>
            <p class="mb-0 mt-1 break-all font-semibold text-slate-950">
              <a
                v-if="submission.email"
                :href="`mailto:${submission.email}`"
                class="text-primary no-underline hover:underline"
              >
                {{ submission.email }}
              </a>
              <span v-else>-</span>
            </p>
          </div>
          <div>
            <span class="text-xs uppercase tracking-wide text-slate-500">Phone</span>
            <p class="mb-0 mt-1 font-semibold text-slate-950">{{ submission.phone || "-" }}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="mb-2 mt-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Message</h3>
        <div class="max-h-[280px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900">
          {{ messageBody || "No message body was included with this submission." }}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h3 class="mb-3 mt-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Customer</h3>
          <dl class="m-0 grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt class="text-slate-500">Type</dt>
              <dd class="m-0 font-medium text-slate-950">{{ customerLabel }}</dd>
            </div>
            <div v-if="submission.customer">
              <dt class="text-slate-500">Customer contact</dt>
              <dd class="m-0 font-medium text-slate-950">
                {{ submission.customer.email || "-" }}
                <span v-if="submission.customer.phone" class="block text-slate-500">{{ submission.customer.phone }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-slate-500">Customer account ID</dt>
              <dd class="m-0 font-medium text-slate-950">{{ submission.customer_account_id || "-" }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h3 class="mb-3 mt-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Storefront</h3>
          <dl class="m-0 grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt class="text-slate-500">Storefront</dt>
              <dd class="m-0 font-medium text-slate-950">
                {{ submission.storefront?.name || "-" }}
                <span v-if="submission.storefront?.slug" class="block text-slate-500">{{ submission.storefront.slug }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-slate-500">Category ID</dt>
              <dd class="m-0 break-all font-medium text-slate-950">{{ submission.storefront_category_id || "-" }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Source</dt>
              <dd class="m-0 font-medium text-slate-950">{{ submission.source || "-" }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <span class="text-sm text-slate-500">Resolved</span>
          <p class="mb-0 mt-1 font-medium text-slate-950">{{ formatContactSubmissionDate(submission.resolved_at) }}</p>
        </div>
        <div>
          <span class="text-sm text-slate-500">Created</span>
          <p class="mb-0 mt-1 font-medium text-slate-950">{{ formatContactSubmissionDate(submission.created_at) }}</p>
        </div>
        <div>
          <span class="text-sm text-slate-500">Updated</span>
          <p class="mb-0 mt-1 font-medium text-slate-950">{{ formatContactSubmissionDate(submission.updated_at) }}</p>
        </div>
      </div>

      <div
        v-if="canUpdate"
        class="rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-end">
          <div class="flex flex-1 flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Change status</label>
            <Select
              v-model="statusDraft"
              :options="CONTACT_SUBMISSION_STATUS_OPTIONS"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <Button
            label="Update status"
            icon="pi pi-check"
            :loading="statusLoading"
            :disabled="!statusDraft || statusDraft === submission.status"
            @click="submitStatusUpdate"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Close"
        severity="secondary"
        text
        @click="closeDialog"
      />
    </template>
  </Dialog>
</template>

