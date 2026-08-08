<script setup>
import { ApiError } from "~/composables/apiClient";
import { useToast } from "primevue/usetoast";
import {
  DISCOUNT_STATE_SEVERITY,
  DISCOUNT_TYPE_LABELS,
} from "~/constants/discountCodes";
import { useDiscountCodeStore } from "~/stores/discountCode";

const route = useRoute();
const discountStore = useDiscountCodeStore();
const toast = useToast();
const id = route.params.id;

const discountCode = computed(() => discountStore.discountCode);
const duplicateDialogVisible = ref(false);
const duplicateCode = ref("");
const duplicateError = ref("");

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value, currency = "NGN") {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatDiscountValue(code) {
  if (!code) return "-";
  if (code.type === "free_shipping") return "Free Shipping";
  if (code.type === "percentage") return `${Number(code.value || 0)}%`;
  return formatMoney(code.value, code.currency || "NGN");
}

function formatBoolean(value) {
  return value ? "Yes" : "No";
}

async function toggleActive() {
  if (!discountCode.value) return;
  try {
    if (discountCode.value.is_active) {
      await discountStore.deactivateDiscountCode(id);
      toast.add({ severity: "success", summary: "Discount disabled", life: 3000 });
    } else {
      await discountStore.activateDiscountCode(id);
      toast.add({ severity: "success", summary: "Discount enabled", life: 3000 });
    }
  } catch (e) {
    toast.add({ severity: "error", summary: "Status update failed", detail: e.message, life: 4000 });
  }
}

function openDuplicateDialog() {
  duplicateCode.value = `${discountCode.value.code}_COPY`;
  duplicateError.value = "";
  duplicateDialogVisible.value = true;
}

async function duplicateDiscountCode() {
  duplicateError.value = "";
  if (!duplicateCode.value) {
    duplicateError.value = "Enter a new discount code.";
    return;
  }

  try {
    const response = await discountStore.duplicateDiscountCode(id, duplicateCode.value.toUpperCase().trim());
    duplicateDialogVisible.value = false;
    toast.add({ severity: "success", summary: "Discount duplicated", life: 3000 });
    await navigateTo(`/discount-codes/${response.data.id}`);
  } catch (e) {
    duplicateError.value = e instanceof ApiError ? e.message : "Unable to duplicate discount code";
  }
}

onMounted(() => {
  discountStore.fetchDiscountCode(id);
});
</script>

<template>
  <div>
    <Toast />

    <Dialog v-model:visible="duplicateDialogVisible" modal header="Duplicate Discount Code" class="w-full max-w-md">
      <div class="flex flex-col gap-3">
        <Message v-if="duplicateError" severity="error" :closable="false">
          {{ duplicateError }}
        </Message>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">New Code</label>
          <InputText v-model="duplicateCode" placeholder="WELCOME10_COPY" autofocus fluid />
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancel" severity="secondary" text @click="duplicateDialogVisible = false" />
          <Button label="Duplicate" icon="pi pi-copy" :loading="discountStore.actionLoading" @click="duplicateDiscountCode" />
        </div>
      </div>
    </Dialog>

    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/discount-codes">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 m-0">
            {{ discountCode?.code || "Discount Code" }}
          </h1>
          <p v-if="discountCode" class="text-sm text-slate-500 m-0">{{ discountCode.name }}</p>
        </div>
      </div>

      <div v-if="discountCode" class="flex items-center gap-2">
        <Button
          :label="discountCode.is_active ? 'Disable' : 'Enable'"
          :icon="discountCode.is_active ? 'pi pi-pause' : 'pi pi-play'"
          :severity="discountCode.is_active ? 'warning' : 'success'"
          :loading="discountStore.actionLoading"
          @click="toggleActive"
        />
        <Button label="Duplicate" icon="pi pi-copy" severity="secondary" outlined @click="openDuplicateDialog" />
        <NuxtLink :to="`/discount-codes/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
      </div>
    </div>

    <div v-if="discountStore.detailLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="discountStore.detailError" severity="error">
      {{ discountStore.detailError }}
    </Message>

    <div v-else-if="discountCode" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 grid grid-cols-1 gap-6">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Discount Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <span class="text-sm text-slate-500">Code</span>
              <p class="font-semibold text-slate-900">{{ discountCode.code }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">State</span>
              <p>
                <Tag :value="discountCode.state || '-'" :severity="DISCOUNT_STATE_SEVERITY[discountCode.state] || 'secondary'" />
              </p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Type</span>
              <p class="font-medium text-slate-900">{{ DISCOUNT_TYPE_LABELS[discountCode.type] || discountCode.type }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Value</span>
              <p class="font-medium text-slate-900">{{ formatDiscountValue(discountCode) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Max Discount Amount</span>
              <p class="font-medium text-slate-900">{{ formatMoney(discountCode.maximum_discount_amount, discountCode.currency || "NGN") }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Minimum Subtotal</span>
              <p class="font-medium text-slate-900">{{ formatMoney(discountCode.minimum_subtotal, discountCode.currency || "NGN") }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Description</h2>
          <p class="font-medium text-slate-900 whitespace-pre-wrap">{{ discountCode.description || "-" }}</p>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Catalog Targets</h2>
          <DataTable v-if="discountCode.targets?.length" :value="discountCode.targets" striped-rows>
            <Column field="mode" header="Mode">
              <template #body="{ data }">
                <Tag :value="data.mode" :severity="data.mode === 'include' ? 'success' : 'danger'" />
              </template>
            </Column>
            <Column field="target_type" header="Type" />
            <Column field="target_id" header="Target ID" />
          </DataTable>
          <div v-else class="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No catalog targets. The discount can apply to the eligible storefront catalog.
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 content-start">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Eligibility</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-slate-500">Enabled</span>
              <Tag :value="discountCode.is_active ? 'Yes' : 'No'" :severity="discountCode.is_active ? 'success' : 'danger'" />
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-slate-500">First order only</span>
              <span class="font-medium text-slate-900">{{ formatBoolean(discountCode.first_order_only) }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-slate-500">Sale items</span>
              <span class="font-medium text-slate-900">{{ formatBoolean(discountCode.applies_to_sale_items) }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-slate-500">All storefronts</span>
              <span class="font-medium text-slate-900">{{ formatBoolean(discountCode.applies_to_all_storefronts) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Usage Limits</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-slate-500">Total</span>
              <span class="font-medium text-slate-900">{{ discountCode.total_usage_limit || "Unlimited" }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-slate-500">Per customer</span>
              <span class="font-medium text-slate-900">{{ discountCode.per_customer_usage_limit || "Unlimited" }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Storefronts</h2>
          <div v-if="discountCode.applies_to_all_storefronts" class="text-sm font-medium text-slate-900">
            All storefronts
          </div>
          <div v-else-if="discountCode.storefronts?.length" class="flex flex-wrap gap-2">
            <Tag v-for="storefront in discountCode.storefronts" :key="storefront.id" :value="storefront.name" severity="info" />
          </div>
          <div v-else class="text-sm text-slate-500">No storefronts selected</div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Schedule</h2>
          <div class="space-y-3">
            <div>
              <span class="text-sm text-slate-500">Starts At</span>
              <p class="font-medium text-slate-900">{{ formatDate(discountCode.starts_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Ends At</span>
              <p class="font-medium text-slate-900">{{ formatDate(discountCode.ends_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Created At</span>
              <p class="font-medium text-slate-900">{{ formatDate(discountCode.created_at) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Updated At</span>
              <p class="font-medium text-slate-900">{{ formatDate(discountCode.updated_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
