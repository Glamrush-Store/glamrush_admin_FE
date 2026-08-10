<script setup>
import { useToast } from "primevue/usetoast";
import { useManualOrderStore } from "~/stores/manualOrder";
import {
  MANUAL_ORDER_CURRENCY,
  MANUAL_ORDER_DEFAULTS,
  MANUAL_ORDER_STATUS_OPTIONS,
  MANUAL_SHIPMENT_STATUS_OPTIONS,
} from "~/constants/manualOrders";

const router = useRouter();
const toast = useToast();
const manualOrderStore = useManualOrderStore();
const { can } = usePermissions();
const canViewProducts = computed(() => can("View_Product"));

const form = reactive({
  customer_mode: "guest",
  customer_id: null,
  shipping_address: {
    name: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: MANUAL_ORDER_DEFAULTS.country,
    postal_code: "",
  },
  billing_same_as_shipping: true,
  billing_address: {
    name: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: MANUAL_ORDER_DEFAULTS.country,
    postal_code: "",
  },
  items: [],
  payment_method_id: null,
  transaction_reference: "",
  shipping_method_id: null,
  shipping_zone_id: null,
  shipping_rate_id: null,
  shipping_amount: 0,
  carrier: "",
  tracking_number: "",
  order_status: MANUAL_ORDER_DEFAULTS.order_status,
  shipment_status: MANUAL_ORDER_DEFAULTS.shipment_status,
  placed_at: new Date(),
});

const selectedProductId = shallowRef(null);
const selectedVariantId = shallowRef(null);
const productSearch = shallowRef("");
const customerSearchTimeout = shallowRef(null);
const productSearchTimeout = shallowRef(null);
const clientErrors = ref({});
const hasInteracted = shallowRef(false);

const customerOptions = computed(() =>
  manualOrderStore.customers.map((customer) => ({
    ...customer,
    label: [customer.name, customer.email, customer.phone].filter(Boolean).join(" - "),
  }))
);

const selectedCustomer = computed(() =>
  manualOrderStore.customers.find((customer) => customer.id === form.customer_id)
);

const selectedPaymentMethod = computed(() =>
  manualOrderStore.paymentMethods.find((method) => method.id === form.payment_method_id)
);

const selectedShippingRate = computed(() =>
  manualOrderStore.shippingRates.find((rate) => rate.id === form.shipping_rate_id)
);

const selectedVariant = computed(() =>
  manualOrderStore.variantOptions.find((option) => option.id === selectedVariantId.value)
);

const hasMoreProducts = computed(
  () => manualOrderStore.productPagination.current_page < manualOrderStore.productPagination.last_page
);

const subtotal = computed(() =>
  form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)
);
const grandTotal = computed(() => subtotal.value + Number(form.shipping_amount || 0));
const paymentReferenceRecommended = computed(() => {
  const text = `${selectedPaymentMethod.value?.name || ""} ${selectedPaymentMethod.value?.code || ""}`.toLowerCase();
  return text.includes("pos") || text.includes("bank") || text.includes("transfer");
});

const fieldErrors = computed(() => ({ ...manualOrderStore.validationErrors, ...clientErrors.value }));

function fieldError(path) {
  const value = fieldErrors.value[path];
  return Array.isArray(value) ? value[0] : value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: MANUAL_ORDER_CURRENCY,
  }).format(Number(value || 0));
}

function normalizeMoney(value) {
  const numeric = Number(value || 0);
  return numeric.toFixed(2);
}

function addressPayload(address) {
  return {
    name: address.name,
    phone: address.phone,
    email: address.email || null,
    address_line_1: address.address_line_1,
    address_line_2: address.address_line_2 || null,
    city: address.city,
    state: address.state,
    country: address.country,
    postal_code: address.postal_code || null,
  };
}

function onCustomerFilter(event) {
  clearTimeout(customerSearchTimeout.value);
  customerSearchTimeout.value = setTimeout(() => {
    manualOrderStore.fetchCustomers(event.value || "");
  }, 350);
}

function onProductFilter(event) {
  clearTimeout(productSearchTimeout.value);
  productSearch.value = event.value || "";
  productSearchTimeout.value = setTimeout(() => {
    selectedProductId.value = null;
    selectedVariantId.value = null;
    manualOrderStore.fetchProducts({ search: productSearch.value, page: 1 });
  }, 350);
}

async function onProductChange(productId) {
  selectedVariantId.value = null;
  const variants = await manualOrderStore.fetchProductVariants(productId);
  const selectableVariants = variants.filter((variant) => !variant.disabled);
  const defaultVariant = selectableVariants.find((variant) => variant.is_default);
  if (selectableVariants.length === 1) selectedVariantId.value = selectableVariants[0].id;
  if (selectableVariants.length > 1 && defaultVariant) selectedVariantId.value = defaultVariant.id;
}

function loadMoreProducts() {
  manualOrderStore.fetchProducts({
    search: productSearch.value,
    page: manualOrderStore.productPagination.current_page + 1,
    append: true,
  });
}

function retryProducts() {
  manualOrderStore.fetchProducts({ search: productSearch.value, page: 1 });
}

function retryProductVariants() {
  manualOrderStore.fetchProductVariants(selectedProductId.value);
}

function addSelectedVariant() {
  const variant = selectedVariant.value;
  if (!variant || variant.disabled) return;

  const existing = form.items.find((item) => item.product_variant_id === variant.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    form.items.push({
      product_variant_id: variant.id,
      product_name: variant.product_name,
      variant_name: variant.variant_name,
      sku: variant.sku,
      available_stock: variant.stock,
      manage_stock: variant.manage_stock,
      quantity: 1,
      unit_price: variant.price,
    });
  }

  selectedVariantId.value = null;
  hasInteracted.value = true;
}

function removeItem(index) {
  form.items.splice(index, 1);
  hasInteracted.value = true;
}

function validateForm() {
  const errors = {};
  const requiredShippingFields = ["name", "phone", "address_line_1", "city", "state", "country"];

  if (form.customer_mode === "customer" && !form.customer_id) errors.customer_id = "Select a customer.";
  requiredShippingFields.forEach((field) => {
    if (!form.shipping_address[field]) errors[`shipping_address.${field}`] = "This field is required.";
  });

  if (!form.billing_same_as_shipping) {
    requiredShippingFields.forEach((field) => {
      if (!form.billing_address[field]) errors[`billing_address.${field}`] = "This field is required.";
    });
  }

  if (!form.items.length) errors.items = "Add at least one product.";
  form.items.forEach((item, index) => {
    if (!item.quantity || item.quantity < 1) errors[`items.${index}.quantity`] = "Quantity must be at least 1.";
    if (item.manage_stock && Number(item.quantity) > Number(item.available_stock)) {
      errors[`items.${index}.quantity`] = "Quantity exceeds available stock.";
    }
    if (Number(item.unit_price) < 0) errors[`items.${index}.unit_price`] = "Unit price cannot be negative.";
  });

  if (!form.payment_method_id) errors.payment_method_id = "Select a payment method.";
  if (!form.shipping_method_id) errors.shipping_method_id = "Select a shipping method.";
  if (!form.shipping_zone_id) errors.shipping_zone_id = "Select a shipping zone.";
  if (Number(form.shipping_amount) < 0) errors.shipping_amount = "Shipping amount cannot be negative.";
  if (!form.placed_at) errors.placed_at = "Select when the sale was placed.";
  if (form.placed_at && new Date(form.placed_at) > new Date()) errors.placed_at = "Placed date cannot be in the future.";
  if (form.order_status === "completed" && form.shipment_status !== "delivered") {
    errors.shipment_status = "Completed orders require delivered shipments.";
  }
  if (form.order_status === "shipped" && !["shipped", "delivered"].includes(form.shipment_status)) {
    errors.shipment_status = "Shipped orders require shipped or delivered shipment status.";
  }

  clientErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function buildPayload() {
  return {
    customer_id: form.customer_mode === "customer" ? form.customer_id : null,
    items: form.items.map((item) => ({
      product_variant_id: item.product_variant_id,
      quantity: Number(item.quantity),
      unit_price: normalizeMoney(item.unit_price),
    })),
    payment_method_id: form.payment_method_id,
    transaction_reference: form.transaction_reference || null,
    shipping_method_id: form.shipping_method_id,
    shipping_zone_id: form.shipping_zone_id,
    shipping_rate_id: form.shipping_rate_id || null,
    shipping_amount: normalizeMoney(form.shipping_amount),
    carrier: form.carrier || null,
    tracking_number: form.tracking_number || null,
    shipping_address: addressPayload(form.shipping_address),
    billing_address: form.billing_same_as_shipping ? null : addressPayload(form.billing_address),
    currency: MANUAL_ORDER_CURRENCY,
    placed_at: new Date(form.placed_at).toISOString(),
    order_status: form.order_status,
    shipment_status: form.shipment_status,
  };
}

async function submitOrder() {
  hasInteracted.value = true;
  manualOrderStore.resetSubmissionState();
  if (!validateForm()) return;

  try {
    const response = await manualOrderStore.createManualOrder(buildPayload());
    const createdOrder = response.data;
    toast.add({
      severity: "success",
      summary: "Offline sale recorded",
      detail: createdOrder?.order_number || "The order has been created.",
      life: 3500,
    });
    hasInteracted.value = false;
    await router.push(`/orders/${createdOrder.id}`);
  } catch (err) {
    toast.add({
      severity: err.status === 409 ? "warn" : "error",
      summary: err.status === 409 ? "Duplicate submission" : "Unable to create order",
      detail: err.message || "Please review the form and try again.",
      life: 5000,
    });
  }
}

function discardAndBack() {
  if (!hasInteracted.value || window.confirm("Discard this manual order?")) {
    router.push("/orders");
  }
}

watch(
  () => [form.shipping_method_id, form.shipping_zone_id],
  ([shippingMethodId, shippingZoneId]) => {
    form.shipping_rate_id = null;
    form.shipping_amount = 0;
    manualOrderStore.fetchShippingRates({ shippingMethodId, shippingZoneId });
  }
);

watch(
  () => form.shipping_rate_id,
  () => {
    if (selectedShippingRate.value) {
      form.shipping_amount = Number(
        selectedShippingRate.value.amount || selectedShippingRate.value.price || selectedShippingRate.value.rate || 0
      );
    }
  }
);

onBeforeRouteLeave(() => {
  if (hasInteracted.value && !window.confirm("Discard this manual order?")) return false;
});

onMounted(() => {
  if (!can("Create_Order")) return;
  manualOrderStore.fetchSetupOptions();
  manualOrderStore.fetchCustomers();
  if (canViewProducts.value) manualOrderStore.fetchProducts({ page: 1 });
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Record Offline Sale</h1>
        <p class="text-sm text-slate-500">Create an already-paid order from an in-store, POS, bank transfer, or phone sale.</p>
      </div>
      <Button label="Back to Orders" icon="pi pi-arrow-left" severity="secondary" outlined @click="discardAndBack" />
    </div>

    <Message v-if="!can('Create_Order')" severity="error" :closable="false">
      You do not have permission to create orders.
    </Message>

    <template v-else>
      <Message v-if="manualOrderStore.conflictError" severity="warn" :closable="false">
        {{ manualOrderStore.conflictError }}
      </Message>
      <Message v-if="manualOrderStore.submitError" severity="error" :closable="false">
        {{ manualOrderStore.submitError }}
      </Message>
      <Message v-if="manualOrderStore.selectorError" severity="error" :closable="false">
        {{ manualOrderStore.selectorError }}
      </Message>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-5">
          <section class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="pi pi-user text-slate-500" />
              <h2 class="text-base font-semibold text-slate-900">Customer</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-field">
                <label>Customer Type</label>
                <SelectButton
                  v-model="form.customer_mode"
                  :options="[
                    { label: 'Guest / Walk-in', value: 'guest' },
                    { label: 'Existing Customer', value: 'customer' },
                  ]"
                  option-label="label"
                  option-value="value"
                />
              </div>
              <div v-if="form.customer_mode === 'customer'" class="form-field">
                <label>Customer</label>
                <Select
                  v-model="form.customer_id"
                  :options="customerOptions"
                  option-label="label"
                  option-value="id"
                  filter
                  show-clear
                  :loading="manualOrderStore.loadingCustomers"
                  placeholder="Search customer"
                  class="w-full"
                  @filter="onCustomerFilter"
                  @change="hasInteracted = true"
                />
                <Message v-if="fieldError('customer_id')" severity="error" size="small" variant="simple">
                  {{ fieldError("customer_id") }}
                </Message>
              </div>
            </div>

            <div v-if="selectedCustomer" class="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              {{ selectedCustomer.name }} - {{ selectedCustomer.email || selectedCustomer.phone || "Customer selected" }}
            </div>
          </section>

          <section class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="pi pi-map-marker text-slate-500" />
              <h2 class="text-base font-semibold text-slate-900">Shipping Info</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div v-for="field in [
                ['name', 'Name'],
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['address_line_1', 'Address Line 1'],
                ['address_line_2', 'Address Line 2'],
                ['city', 'City'],
                ['state', 'State'],
                ['country', 'Country'],
                ['postal_code', 'Postal Code'],
              ]" :key="field[0]" class="form-field">
                <label>{{ field[1] }}</label>
                <InputText v-model="form.shipping_address[field[0]]" class="w-full" @input="hasInteracted = true" />
                <Message v-if="fieldError(`shipping_address.${field[0]}`)" severity="error" size="small" variant="simple">
                  {{ fieldError(`shipping_address.${field[0]}`) }}
                </Message>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-2">
              <Checkbox v-model="form.billing_same_as_shipping" input-id="billingSame" binary />
              <label for="billingSame" class="text-sm text-slate-700">Billing address is the same as shipping</label>
            </div>

            <div v-if="!form.billing_same_as_shipping" class="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
              <div v-for="field in [
                ['name', 'Billing Name'],
                ['phone', 'Billing Phone'],
                ['email', 'Billing Email'],
                ['address_line_1', 'Billing Address Line 1'],
                ['address_line_2', 'Billing Address Line 2'],
                ['city', 'Billing City'],
                ['state', 'Billing State'],
                ['country', 'Billing Country'],
                ['postal_code', 'Billing Postal Code'],
              ]" :key="field[0]" class="form-field">
                <label>{{ field[1] }}</label>
                <InputText v-model="form.billing_address[field[0]]" class="w-full" @input="hasInteracted = true" />
                <Message v-if="fieldError(`billing_address.${field[0]}`)" severity="error" size="small" variant="simple">
                  {{ fieldError(`billing_address.${field[0]}`) }}
                </Message>
              </div>
            </div>
          </section>

          <section class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="pi pi-shopping-bag text-slate-500" />
              <h2 class="text-base font-semibold text-slate-900">Order Items</h2>
            </div>

            <Message v-if="!canViewProducts" severity="error" :closable="false" class="mb-3">
              You do not have permission to view products.
            </Message>

            <div v-else class="space-y-3">
              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div class="form-field">
                  <label>Select Product</label>
                  <Select
                    v-model="selectedProductId"
                    :options="manualOrderStore.products"
                    option-label="label"
                    option-value="id"
                    filter
                    :loading="manualOrderStore.loadingProducts"
                    placeholder="Search published products"
                    class="w-full"
                    @filter="onProductFilter"
                    @update:model-value="onProductChange"
                  >
                    <template #option="{ option }">
                      <div>
                        <div class="font-medium text-white">{{ option.name }}</div>
                        <div class="text-xs text-slate-100">
                          {{ option.type || "product" }} - {{ formatCurrency(option.price || option.sale_price || 0) }}
                        </div>
                      </div>
                    </template>
                    <template #empty>
                      <span v-if="manualOrderStore.loadingProducts">Loading products...</span>
                      <span v-else-if="manualOrderStore.productError">Products could not be loaded. Try again.</span>
                      <span v-else>No products match your search.</span>
                    </template>
                  </Select>
                </div>

                <div class="form-field">
                  <label>Select Variant</label>
                  <Select
                    v-model="selectedVariantId"
                    :options="manualOrderStore.variantOptions"
                    option-label="label"
                    option-value="id"
                    option-disabled="disabled"
                    :loading="manualOrderStore.loadingProductDetails"
                    :disabled="!selectedProductId || manualOrderStore.loadingProductDetails"
                    placeholder="Choose a variant"
                    class="w-full"
                  >
                    <template #option="{ option }">
                      <div class="flex w-full items-start justify-between gap-3">
                        <div>
                          <div class="font-medium text-white">{{ option.variant_name || "Default" }}</div>
                          <div class="text-xs text-slate-100">{{ option.sku }} - {{ formatCurrency(option.price) }}</div>
                          <div class="text-xs" :class="option.disabled ? 'text-red-200' : 'text-slate-100'">
                            {{ option.disabled ? "Out of stock" : option.manage_stock ? `Stock: ${option.stock}` : "Stock not managed" }}
                          </div>
                        </div>
                      </div>
                    </template>
                    <template #empty>
                      <span v-if="manualOrderStore.loadingProductDetails">Loading variants...</span>
                      <span v-else-if="manualOrderStore.noEligibleVariantsMessage">
                        {{ manualOrderStore.noEligibleVariantsMessage }}
                      </span>
                      <span v-else-if="manualOrderStore.productDetailError">Product variants could not be loaded. Try again.</span>
                      <span v-else>Select a product first.</span>
                    </template>
                  </Select>
                </div>

                <Button
                  label="Add Item"
                  icon="pi pi-plus"
                  class="self-end"
                  :disabled="!selectedVariantId || selectedVariant?.disabled"
                  @click="addSelectedVariant"
                />
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button
                  v-if="hasMoreProducts"
                  label="Load More Products"
                  icon="pi pi-angle-down"
                  severity="secondary"
                  text
                  :loading="manualOrderStore.loadingProducts"
                  @click="loadMoreProducts"
                />
                <Button
                  v-if="manualOrderStore.productError"
                  label="Retry Products"
                  icon="pi pi-refresh"
                  severity="secondary"
                  text
                  @click="retryProducts"
                />
                <Button
                  v-if="manualOrderStore.productDetailError && selectedProductId"
                  label="Retry Variants"
                  icon="pi pi-refresh"
                  severity="secondary"
                  text
                  @click="retryProductVariants"
                />
                <span v-if="manualOrderStore.loadingProductDetails" class="text-sm text-slate-500">Loading variants...</span>
              </div>
            </div>

            <Message v-if="manualOrderStore.productError" severity="error" size="small" variant="simple" class="mt-2">
              {{ manualOrderStore.productError }}
            </Message>
            <Message v-if="manualOrderStore.productDetailError" severity="error" size="small" variant="simple" class="mt-2">
              {{ manualOrderStore.productDetailError }}
            </Message>
            <Message v-if="manualOrderStore.noEligibleVariantsMessage" severity="warn" size="small" variant="simple" class="mt-2">
              {{ manualOrderStore.noEligibleVariantsMessage }}
            </Message>
            <Message v-if="fieldError('items')" severity="error" size="small" variant="simple" class="mt-2">
              {{ fieldError("items") }}
            </Message>

            <DataTable :value="form.items" class="mt-4" striped-rows>
              <Column header="Product">
                <template #body="{ data }">
                  <div class="font-medium text-slate-900">{{ data.product_name }}</div>
                  <div class="text-xs text-slate-500">{{ data.variant_name || "Default" }} - {{ data.sku }}</div>
                  <div v-if="data.manage_stock && data.quantity > data.available_stock" class="mt-1 text-xs text-red-600">
                    Available stock: {{ data.available_stock }}
                  </div>
                </template>
              </Column>
              <Column header="Qty" class="w-36">
                <template #body="{ data, index }">
                  <InputNumber v-model="data.quantity" :min="1" show-buttons class="w-full" />
                  <Message v-if="fieldError(`items.${index}.quantity`)" severity="error" size="small" variant="simple">
                    {{ fieldError(`items.${index}.quantity`) }}
                  </Message>
                </template>
              </Column>
              <Column header="Unit Price" class="w-44">
                <template #body="{ data, index }">
                  <InputNumber v-model="data.unit_price" mode="currency" currency="NGN" locale="en-NG" :min="0" class="w-full" />
                  <Message v-if="fieldError(`items.${index}.unit_price`)" severity="error" size="small" variant="simple">
                    {{ fieldError(`items.${index}.unit_price`) }}
                  </Message>
                </template>
              </Column>
              <Column header="Line Total" class="w-36">
                <template #body="{ data }">{{ formatCurrency(data.quantity * data.unit_price) }}</template>
              </Column>
              <Column header="" class="w-16">
                <template #body="{ index }">
                  <Button icon="pi pi-trash" severity="danger" text rounded @click="removeItem(index)" />
                </template>
              </Column>
              <template #empty>
                <div class="py-6 text-center text-sm text-slate-500">No products added yet.</div>
              </template>
            </DataTable>
          </section>

          <section class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="pi pi-credit-card text-slate-500" />
              <h2 class="text-base font-semibold text-slate-900">Payment</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-field">
                <label>Payment Method</label>
                <Select
                  v-model="form.payment_method_id"
                  :options="manualOrderStore.paymentMethods"
                  option-label="name"
                  option-value="id"
                  :loading="manualOrderStore.loadingSetup"
                  placeholder="Select method"
                  class="w-full"
                  @change="hasInteracted = true"
                />
                <Message v-if="fieldError('payment_method_id')" severity="error" size="small" variant="simple">
                  {{ fieldError("payment_method_id") }}
                </Message>
              </div>
              <div class="form-field">
                <label>Transaction Reference</label>
                <InputText v-model="form.transaction_reference" class="w-full" placeholder="POS slip, transfer ref, receipt number" />
                <small v-if="paymentReferenceRecommended" class="text-amber-700">
                  Recommended for POS and bank transfer payments.
                </small>
              </div>
            </div>
          </section>

          <section class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="pi pi-truck text-slate-500" />
              <h2 class="text-base font-semibold text-slate-900">Shipping Method</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-field">
                <label>Method</label>
                <Select v-model="form.shipping_method_id" :options="manualOrderStore.shippingMethods" option-label="name" option-value="id" placeholder="Select method" class="w-full" />
                <Message v-if="fieldError('shipping_method_id')" severity="error" size="small" variant="simple">
                  {{ fieldError("shipping_method_id") }}
                </Message>
              </div>
              <div class="form-field">
                <label>Zone</label>
                <Select v-model="form.shipping_zone_id" :options="manualOrderStore.shippingZones" option-label="name" option-value="id" placeholder="Select zone" class="w-full" />
                <Message v-if="fieldError('shipping_zone_id')" severity="error" size="small" variant="simple">
                  {{ fieldError("shipping_zone_id") }}
                </Message>
              </div>
              <div class="form-field">
                <label>Rate</label>
                <Select
                  v-model="form.shipping_rate_id"
                  :options="manualOrderStore.shippingRates"
                  option-label="name"
                  option-value="id"
                  show-clear
                  :loading="manualOrderStore.loadingRates"
                  placeholder="Select rate or enter manual amount"
                  class="w-full"
                />
              </div>
              <div class="form-field">
                <label>Shipping Amount</label>
                <InputNumber v-model="form.shipping_amount" mode="currency" currency="NGN" locale="en-NG" :min="0" class="w-full" />
                <Message v-if="fieldError('shipping_amount')" severity="error" size="small" variant="simple">
                  {{ fieldError("shipping_amount") }}
                </Message>
              </div>
              <div class="form-field">
                <label>Carrier</label>
                <InputText v-model="form.carrier" class="w-full" />
              </div>
              <div class="form-field">
                <label>Tracking Number</label>
                <InputText v-model="form.tracking_number" class="w-full" />
              </div>
            </div>
          </section>

          <section class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="pi pi-calendar text-slate-500" />
              <h2 class="text-base font-semibold text-slate-900">Sale Details</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div class="form-field">
                <label>Placed At</label>
                <DatePicker v-model="form.placed_at" show-time hour-format="24" date-format="yy-mm-dd" class="w-full" />
                <Message v-if="fieldError('placed_at')" severity="error" size="small" variant="simple">
                  {{ fieldError("placed_at") }}
                </Message>
              </div>
              <div class="form-field">
                <label>Order Status</label>
                <Select v-model="form.order_status" :options="MANUAL_ORDER_STATUS_OPTIONS" option-label="label" option-value="value" class="w-full" />
              </div>
              <div class="form-field">
                <label>Shipment Status</label>
                <Select v-model="form.shipment_status" :options="MANUAL_SHIPMENT_STATUS_OPTIONS" option-label="label" option-value="value" class="w-full" />
                <Message v-if="fieldError('shipment_status')" severity="error" size="small" variant="simple">
                  {{ fieldError("shipment_status") }}
                </Message>
              </div>
            </div>
          </section>
        </div>

        <aside class="h-fit rounded-lg border border-slate-200 bg-white p-5 xl:sticky xl:top-5">
          <div class="mb-4 flex items-center gap-2">
            <i class="pi pi-receipt text-slate-500" />
            <h2 class="text-base font-semibold text-slate-900">Review</h2>
          </div>

          <dl class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Customer</dt>
              <dd class="text-right font-medium text-slate-800">{{ selectedCustomer?.name || "Guest / Walk-in" }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Payment</dt>
              <dd class="text-right font-medium text-slate-800">{{ selectedPaymentMethod?.name || "-" }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Order Status</dt>
              <dd class="text-right font-medium text-slate-800">{{ form.order_status }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Shipment</dt>
              <dd class="text-right font-medium text-slate-800">{{ form.shipment_status }}</dd>
            </div>
            <Divider />
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Items</dt>
              <dd class="font-medium text-slate-800">{{ form.items.length }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Subtotal</dt>
              <dd class="font-medium text-slate-800">{{ formatCurrency(subtotal) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Shipping</dt>
              <dd class="font-medium text-slate-800">{{ formatCurrency(form.shipping_amount) }}</dd>
            </div>
            <div class="flex justify-between gap-4 text-base">
              <dt class="font-semibold text-slate-900">Grand Total</dt>
              <dd class="font-bold text-slate-900">{{ formatCurrency(grandTotal) }}</dd>
            </div>
          </dl>

          <Message severity="info" :closable="false" class="mt-5">
            Manual orders are submitted as already-paid sales. The same idempotency key is reused if this attempt fails.
          </Message>

          <Button
            label="Create Manual Order"
            icon="pi pi-check"
            class="mt-5 w-full"
            :loading="manualOrderStore.submitting"
            @click="submitOrder"
          />
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(51 65 85);
}
</style>
