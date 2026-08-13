export const PAYMENT_TRANSACTION_STATUS_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Initialized", value: "initialized" },
  { label: "Pending On Delivery", value: "pending_on_delivery" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
];

export const PAYMENT_TRANSACTION_TYPE_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Capture", value: "capture" },
  { label: "Initialize", value: "initialize" },
  { label: "Verify", value: "verify" },
  { label: "Failed", value: "failed" },
  { label: "Refund", value: "refund" },
  { label: "Webhook", value: "webhook" },
];

export const PAYMENT_PROVIDER_OPTIONS = [
  { label: "Paystack", value: "paystack" },
  { label: "Flutterwave", value: "flutterwave" },
  { label: "Pay On Delivery", value: "pay_on_delivery" },
];

export const PAYMENT_TRANSACTION_STATUS_SEVERITY = {
  paid: "success",
  pending: "warn",
  initialized: "info",
  pending_on_delivery: "warn",
  failed: "danger",
  refunded: "secondary",
  cancelled: "danger",
};

export function humanizePaymentTransactionStatus(status) {
  if (!status) return "-";
  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
