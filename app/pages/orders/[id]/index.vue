<script setup>
import { useOrderStore } from "~/stores/order";
import { ApiError } from "~/composables/apiClient";
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_SEVERITY } from "~/constants/orders";

const route = useRoute();
const orderStore = useOrderStore();
const toast = useToast();
const id = route.params.id;
const selectedStatus = ref(null);

const order = computed(() => orderStore.order);
const customerInfo = computed(() => order.value?.customer_info || null);
const shippingInfo = computed(() => order.value?.shipping_info || {});
const paymentInfo = computed(() => order.value?.payment_info || {});
const orderInfo = computed(() => order.value?.order_info || {});
const orderItems = computed(() => order.value?.items || []);
const shippingAddress = computed(() => shippingInfo.value.shipping_address || {});
const billingAddress = computed(() => shippingInfo.value.billing_address || null);
const isStatusDirty = computed(() => selectedStatus.value && selectedStatus.value !== order.value?.status);

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
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

function formatPrice(value, currency = "NGN") {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatAddress(address) {
  const name = [address?.first_name, address?.last_name].filter(Boolean).join(" ");
  const parts = [
    name,
    address?.phone,
    address?.address_line_1,
    address?.address_line_2,
    address?.city,
    address?.state,
    address?.postal_code,
    address?.country,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "-";
}

function customerTypeLabel(type) {
  return type === "customer" ? "Customer" : "Guest";
}

async function updateStatus() {
  if (!isStatusDirty.value) return;

  try {
    await orderStore.updateOrderStatus(id, selectedStatus.value);
    toast.add({
      severity: "success",
      summary: "Status Updated",
      detail: `Order status changed to ${selectedStatus.value}`,
      life: 3000,
    });
  } catch (error) {
    const detail = error instanceof ApiError ? error.message : "Unable to update order status";
    toast.add({ severity: "error", summary: "Update Failed", detail, life: 4000 });
  }
}

watch(
  () => order.value?.status,
  (status) => {
    selectedStatus.value = status || null;
  },
  { immediate: true }
);

onMounted(() => {
  orderStore.fetchOrder(id);
});
</script>

<template>
  <div>
    <Toast />

    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/orders">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            Order {{ order?.order_number || "-" }}
          </h1>
          <p v-if="order" class="text-sm text-slate-500 mt-1">
            Placed {{ formatDateTime(orderInfo.placed_at) }}
          </p>
        </div>
      </div>
      <div v-if="order" class="flex flex-wrap items-center justify-end gap-2">
        <Tag
          :value="order.status || '-'"
          :severity="ORDER_STATUS_SEVERITY[order.status] || 'secondary'"
        />
        <Select
          v-model="selectedStatus"
          :options="ORDER_STATUS_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-56"
          :disabled="orderStore.statusUpdating"
          placeholder="Select status"
        />
        <Button
          label="Update Status"
          icon="pi pi-refresh"
          :loading="orderStore.statusUpdating"
          :disabled="!isStatusDirty"
          @click="updateStatus"
        />
      </div>
    </div>

    <Message v-if="orderStore.orderError" severity="error" class="mb-4">
      {{ orderStore.orderError }}
    </Message>
    <Message v-if="orderStore.statusError" severity="error" class="mb-4">
      {{ orderStore.statusError }}
    </Message>

    <div v-if="orderStore.orderLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else-if="order" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-800">Customer Info</h2>
            <Tag
              v-if="customerInfo"
              :value="customerTypeLabel(customerInfo.type)"
              :severity="customerInfo.type === 'customer' ? 'success' : 'secondary'"
            />
          </div>
          <div v-if="customerInfo" class="space-y-4">
            <div>
              <span class="text-sm text-slate-500">Name</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(customerInfo.name) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Email</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(customerInfo.email) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Phone</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(customerInfo.phone) }}</p>
            </div>
            <div v-if="customerInfo.type === 'customer'">
              <span class="text-sm text-slate-500">Customer Since</span>
              <p class="font-medium text-slate-900">{{ formatDateTime(customerInfo.created_at) }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">No customer profile is attached to this order.</p>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Shipping Info</h2>
          <div class="space-y-4">
            <div>
              <span class="text-sm text-slate-500">Method</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(shippingInfo.shipping_method_name) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Zone</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(shippingInfo.shipping_zone_name) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Shipping Address</span>
              <p class="font-medium text-slate-900">{{ formatAddress(shippingAddress) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Billing Address</span>
              <p class="font-medium text-slate-900">
                {{ billingAddress ? formatAddress(billingAddress) : "Same as shipping / not provided" }}
              </p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Shipment</span>
              <p class="font-medium text-slate-900">{{ shippingInfo.shipment ? shippingInfo.shipment.status : "Not created" }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Payment Info</h2>
          <div class="space-y-4">
            <div>
              <span class="text-sm text-slate-500">Provider</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(paymentInfo.provider) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Method</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(paymentInfo.payment_method?.name) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Status</span>
              <p>
                <Tag
                  :value="paymentInfo.status || '-'"
                  :severity="ORDER_STATUS_SEVERITY[paymentInfo.status] || 'secondary'"
                />
              </p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Reference</span>
              <p class="font-medium text-slate-900 break-all">{{ valueOrDash(paymentInfo.reference) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Transaction ID</span>
              <p class="font-medium text-slate-900">{{ valueOrDash(paymentInfo.transaction_id) }}</p>
            </div>
            <div>
              <span class="text-sm text-slate-500">Paid At</span>
              <p class="font-medium text-slate-900">{{ formatDateTime(paymentInfo.paid_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Order Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <span class="text-sm text-slate-500">Order Number</span>
            <p class="font-medium text-slate-900">{{ order.order_number }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Status</span>
            <p>
              <Tag :value="order.status" :severity="ORDER_STATUS_SEVERITY[order.status] || 'secondary'" />
            </p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Currency</span>
            <p class="font-medium text-slate-900">{{ valueOrDash(orderInfo.currency) }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Subtotal</span>
            <p class="font-medium text-slate-900">{{ formatPrice(orderInfo.subtotal, orderInfo.currency) }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Shipping</span>
            <p class="font-medium text-slate-900">{{ formatPrice(orderInfo.shipping_amount, orderInfo.currency) }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Total</span>
            <p class="text-lg font-bold text-slate-900">{{ formatPrice(orderInfo.total, orderInfo.currency) }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Placed At</span>
            <p class="font-medium text-slate-900">{{ formatDateTime(orderInfo.placed_at) }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Paid At</span>
            <p class="font-medium text-slate-900">{{ formatDateTime(orderInfo.paid_at) }}</p>
          </div>
          <div>
            <span class="text-sm text-slate-500">Cancelled At</span>
            <p class="font-medium text-slate-900">{{ formatDateTime(orderInfo.cancelled_at) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Order Items</h2>
        <DataTable :value="orderItems" striped-rows>
          <Column header="Product">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <img
                  v-if="data.images?.[0]?.url"
                  :src="data.images[0].url"
                  :alt="data.product_name"
                  class="w-12 h-12 object-cover rounded border border-slate-200"
                />
                <div>
                  <p class="font-medium text-slate-900">{{ data.product_name }}</p>
                  <p class="text-sm text-slate-500">{{ data.sku }}</p>
                </div>
              </div>
            </template>
          </Column>
          <Column field="quantity" header="Quantity" />
          <Column header="Unit Price">
            <template #body="{ data }">{{ formatPrice(data.unit_price, orderInfo.currency) }}</template>
          </Column>
          <Column header="Line Total">
            <template #body="{ data }">{{ formatPrice(data.line_total, orderInfo.currency) }}</template>
          </Column>
        </DataTable>
      </div>

      <div
        v-if="paymentInfo.transactions?.length"
        class="bg-white rounded-lg border border-slate-200 p-6"
      >
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Payment Transactions</h2>
        <DataTable :value="paymentInfo.transactions" striped-rows>
          <Column field="type" header="Type" />
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="ORDER_STATUS_SEVERITY[data.status] || 'secondary'" />
            </template>
          </Column>
          <Column header="Amount">
            <template #body="{ data }">{{ formatPrice(data.amount, data.currency) }}</template>
          </Column>
          <Column field="provider_reference" header="Provider Reference" />
          <Column header="Created">
            <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>
