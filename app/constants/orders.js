export const ORDER_STATUS_OPTIONS = [
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Pending On Delivery", value: "pending_on_delivery" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

export const ORDER_STATUS_FILTER_OPTIONS = [
  { label: "All", value: null },
  ...ORDER_STATUS_OPTIONS,
];

export const ORDER_STATUS_SEVERITY = {
  pending_payment: "warn",
  pending_on_delivery: "warn",
  paid: "success",
  processing: "info",
  shipped: "contrast",
  completed: "success",
  cancelled: "danger",
  failed: "danger",
  refunded: "secondary",
};

export const PAYMENT_STATUS_SEVERITY = {
  pending: "warn",
  initialized: "info",
  pending_on_delivery: "warn",
  paid: "success",
  failed: "danger",
  refunded: "secondary",
};
