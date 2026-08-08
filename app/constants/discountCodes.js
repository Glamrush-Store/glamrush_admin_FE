export const DISCOUNT_TYPE_OPTIONS = [
  { label: "Percentage", value: "percentage" },
  { label: "Fixed Amount", value: "fixed_amount" },
  { label: "Free Shipping", value: "free_shipping" },
];

export const DISCOUNT_STATE_OPTIONS = [
  { label: "All States", value: null },
  { label: "Active", value: "active" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Expired", value: "expired" },
  { label: "Draft", value: "draft" },
  { label: "Inactive", value: "inactive" },
];

export const DISCOUNT_ACTIVE_OPTIONS = [
  { label: "Any Status", value: null },
  { label: "Enabled", value: true },
  { label: "Disabled", value: false },
];

export const DISCOUNT_TARGET_TYPE_OPTIONS = [
  { label: "Product", value: "product" },
  { label: "Product Variant", value: "product_variant" },
  { label: "Category", value: "category" },
  { label: "Brand", value: "brand" },
  { label: "Collection", value: "collection" },
];

export const DISCOUNT_TARGET_MODE_OPTIONS = [
  { label: "Include", value: "include" },
  { label: "Exclude", value: "exclude" },
];

export const DISCOUNT_STATE_SEVERITY = {
  active: "success",
  scheduled: "info",
  expired: "danger",
  draft: "secondary",
  inactive: "warning",
};

export const DISCOUNT_TYPE_LABELS = {
  percentage: "Percentage",
  fixed_amount: "Fixed Amount",
  free_shipping: "Free Shipping",
};
