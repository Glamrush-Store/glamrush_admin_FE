<script setup>
import { yupResolver } from "@primevue/forms/resolvers/yup";
import { object, string } from "yup";
import {
  DISCOUNT_TARGET_MODE_OPTIONS,
  DISCOUNT_TARGET_TYPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
} from "~/constants/discountCodes";

const props = defineProps({
  initialValues: {
    type: Object,
    default: () => ({}),
  },
  storefronts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: "Save Discount Code",
  },
  serverError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["submit"]);

const resolver = yupResolver(
  object({
    code: string()
      .required("Code is required")
      .max(64, "Max 64 characters")
      .matches(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores"),
    name: string().required("Name is required").max(255, "Max 255 characters"),
    description: string().nullable().max(5000, "Max 5000 characters"),
  }),
);

const type = ref("percentage");
const value = ref(null);
const currency = ref("NGN");
const maximumDiscountAmount = ref(null);
const minimumSubtotal = ref(null);
const startsAt = ref(null);
const endsAt = ref(null);
const isActive = ref(true);
const totalUsageLimit = ref(null);
const perCustomerUsageLimit = ref(null);
const firstOrderOnly = ref(false);
const appliesToSaleItems = ref(true);
const appliesToAllStorefronts = ref(true);
const storefrontIds = ref([]);
const targets = ref([]);
const localError = ref("");

const formInitialValues = computed(() => ({
  code: props.initialValues.code || "",
  name: props.initialValues.name || "",
  description: props.initialValues.description || "",
}));

watch(
  () => props.initialValues,
  (initial) => {
    type.value = initial.type || "percentage";
    value.value = initial.value === undefined ? null : initial.value;
    currency.value = initial.currency || "NGN";
    maximumDiscountAmount.value = initial.maximum_discount_amount ?? null;
    minimumSubtotal.value = initial.minimum_subtotal ?? null;
    startsAt.value = initial.starts_at ? new Date(initial.starts_at) : null;
    endsAt.value = initial.ends_at ? new Date(initial.ends_at) : null;
    isActive.value = initial.is_active ?? true;
    totalUsageLimit.value = initial.total_usage_limit ?? null;
    perCustomerUsageLimit.value = initial.per_customer_usage_limit ?? null;
    firstOrderOnly.value = initial.first_order_only ?? false;
    appliesToSaleItems.value = initial.applies_to_sale_items ?? true;
    appliesToAllStorefronts.value = initial.applies_to_all_storefronts ?? true;
    storefrontIds.value = (initial.storefronts || []).map((storefront) => storefront.id);
    targets.value = (initial.targets || []).map((target) => ({
      target_type: target.target_type || "product",
      target_id: target.target_id || "",
      mode: target.mode || "include",
    }));
  },
  { immediate: true },
);

watch(type, (selectedType) => {
  if (selectedType !== "fixed_amount") currency.value = null;
  if (selectedType !== "percentage") maximumDiscountAmount.value = null;
  if (selectedType === "free_shipping") value.value = null;
  if (selectedType === "fixed_amount" && !currency.value) currency.value = "NGN";
});

watch(appliesToAllStorefronts, (global) => {
  if (global) storefrontIds.value = [];
});

function addTarget() {
  targets.value.push({
    target_type: "product",
    target_id: "",
    mode: "include",
  });
}

function removeTarget(index) {
  targets.value.splice(index, 1);
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

function toDateString(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function validateLocalRules() {
  localError.value = "";

  if (type.value === "percentage" && (!value.value || Number(value.value) > 100)) {
    localError.value = "Percentage discounts require a value greater than 0 and no more than 100.";
    return false;
  }

  if (type.value === "fixed_amount" && (!value.value || !currency.value)) {
    localError.value = "Fixed amount discounts require a value and currency.";
    return false;
  }

  if (!appliesToAllStorefronts.value && storefrontIds.value.length === 0) {
    localError.value = "Select at least one storefront for non-global discount codes.";
    return false;
  }

  if (totalUsageLimit.value && perCustomerUsageLimit.value && Number(perCustomerUsageLimit.value) > Number(totalUsageLimit.value)) {
    localError.value = "Per-customer usage limit cannot exceed the total usage limit.";
    return false;
  }

  if (startsAt.value && endsAt.value && new Date(endsAt.value) <= new Date(startsAt.value)) {
    localError.value = "End time must be later than start time.";
    return false;
  }

  const invalidTarget = targets.value.find((target) => !target.target_id);
  if (invalidTarget) {
    localError.value = "Each target row must include a target ID.";
    return false;
  }

  return true;
}

function buildPayload(values) {
  return {
    code: values.code.toUpperCase().trim(),
    name: values.name,
    description: values.description || null,
    type: type.value,
    value: type.value === "free_shipping" ? null : toNumberOrNull(value.value),
    currency: type.value === "fixed_amount" ? (currency.value || "").toUpperCase() : null,
    maximum_discount_amount: type.value === "percentage" ? toNumberOrNull(maximumDiscountAmount.value) : null,
    minimum_subtotal: toNumberOrNull(minimumSubtotal.value),
    starts_at: toDateString(startsAt.value),
    ends_at: toDateString(endsAt.value),
    is_active: isActive.value,
    total_usage_limit: toNumberOrNull(totalUsageLimit.value),
    per_customer_usage_limit: toNumberOrNull(perCustomerUsageLimit.value),
    first_order_only: firstOrderOnly.value,
    applies_to_sale_items: appliesToSaleItems.value,
    applies_to_all_storefronts: appliesToAllStorefronts.value,
    storefront_ids: appliesToAllStorefronts.value ? [] : storefrontIds.value,
    targets: targets.value.map((target) => ({
      target_type: target.target_type,
      target_id: target.target_id,
      mode: target.mode,
    })),
  };
}

function onSubmit({ valid, values }) {
  if (!valid || !validateLocalRules()) return;
  emit("submit", buildPayload(values));
}
</script>

<template>
  <Form
    v-slot="$form"
    :key="JSON.stringify(formInitialValues)"
    :initial-values="formInitialValues"
    :resolver="resolver"
    @submit="onSubmit"
  >
    <Message v-if="serverError || localError" severity="error" :closable="false" class="mb-4">
      {{ serverError || localError }}
    </Message>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Discount Setup</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label for="code" class="text-sm font-medium text-slate-700">Code *</label>
          <InputText id="code" name="code" placeholder="WELCOME10" fluid />
          <Message v-if="$form.code?.invalid" severity="error" size="small" variant="simple">
            {{ $form.code.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="name" class="text-sm font-medium text-slate-700">Name *</label>
          <InputText id="name" name="name" placeholder="New customer welcome discount" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Type</label>
          <Select v-model="type" :options="DISCOUNT_TYPE_OPTIONS" option-label="label" option-value="value" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Active</label>
          <ToggleSwitch v-model="isActive" />
        </div>

        <div class="md:col-span-2 flex flex-col gap-1">
          <label for="description" class="text-sm font-medium text-slate-700">Description</label>
          <Textarea id="description" name="description" rows="3" placeholder="Internal notes or customer-facing intent" fluid />
          <Message v-if="$form.description?.invalid" severity="error" size="small" variant="simple">
            {{ $form.description.error?.message }}
          </Message>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Value and Limits</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Value</label>
          <InputNumber v-model="value" :disabled="type === 'free_shipping'" :min="0" mode="decimal" :min-fraction-digits="0" :max-fraction-digits="2" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Currency</label>
          <InputText v-model="currency" :disabled="type !== 'fixed_amount'" maxlength="3" placeholder="NGN" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Max Discount Amount</label>
          <InputNumber v-model="maximumDiscountAmount" :disabled="type !== 'percentage'" :min="0" mode="decimal" :min-fraction-digits="0" :max-fraction-digits="2" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Minimum Subtotal</label>
          <InputNumber v-model="minimumSubtotal" :min="0" mode="decimal" :min-fraction-digits="0" :max-fraction-digits="2" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Total Usage Limit</label>
          <InputNumber v-model="totalUsageLimit" :min="1" :use-grouping="false" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Per-customer Limit</label>
          <InputNumber v-model="perCustomerUsageLimit" :min="1" :use-grouping="false" fluid />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Eligibility</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
          <span class="text-sm font-medium text-slate-700">First order only</span>
          <ToggleSwitch v-model="firstOrderOnly" />
        </div>

        <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
          <span class="text-sm font-medium text-slate-700">Apply to sale items</span>
          <ToggleSwitch v-model="appliesToSaleItems" />
        </div>

        <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
          <span class="text-sm font-medium text-slate-700">All storefronts</span>
          <ToggleSwitch v-model="appliesToAllStorefronts" />
        </div>

        <div v-if="!appliesToAllStorefronts" class="md:col-span-3 flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Storefronts</label>
          <MultiSelect
            v-model="storefrontIds"
            :options="storefronts"
            option-label="name"
            option-value="id"
            display="chip"
            placeholder="Select storefronts"
            fluid
          />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-800">Catalog Targets</h2>
        <Button type="button" label="Add Target" icon="pi pi-plus" severity="secondary" outlined @click="addTarget" />
      </div>

      <Message severity="info" :closable="false" class="mb-4">
        Use target IDs from products, variants, categories, brands, or collections. Empty target list applies to the eligible storefront catalog.
      </Message>

      <div v-if="targets.length" class="flex flex-col gap-3">
        <div v-for="(target, index) in targets" :key="index" class="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end rounded-md border border-slate-200 p-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Mode</label>
            <Select v-model="target.mode" :options="DISCOUNT_TARGET_MODE_OPTIONS" option-label="label" option-value="value" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Type</label>
            <Select v-model="target.target_type" :options="DISCOUNT_TARGET_TYPE_OPTIONS" option-label="label" option-value="value" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Target ID</label>
            <InputText v-model="target.target_id" placeholder="ULID" fluid />
          </div>
          <Button type="button" icon="pi pi-trash" severity="danger" text rounded @click="removeTarget(index)" />
        </div>
      </div>

      <div v-else class="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No catalog targets added.
      </div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">Schedule</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Starts At</label>
          <DatePicker v-model="startsAt" show-time hour-format="24" date-format="yy-mm-dd" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-slate-700">Ends At</label>
          <DatePicker v-model="endsAt" show-time hour-format="24" date-format="yy-mm-dd" fluid />
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <Button type="submit" :label="submitLabel" icon="pi pi-check" :loading="loading" />
    </div>
  </Form>
</template>
