export const MANUAL_ORDER_CURRENCY = "NGN";

export const MANUAL_ORDER_STATUS_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Completed", value: "completed" },
];

export const MANUAL_SHIPMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Ready", value: "ready" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

export const MANUAL_ORDER_DEFAULTS = {
  order_status: "completed",
  shipment_status: "delivered",
  country: "NG",
};
