export const DASHBOARD_PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" },
];

export const DASHBOARD_PERMISSIONS = {
  view: "View_Dashboard",
};

export const STATUS_SEVERITY = {
  pending_payment: "warn",
  pending_on_delivery: "warn",
  paid: "success",
  processing: "info",
  shipped: "contrast",
  completed: "success",
  cancelled: "danger",
  failed: "danger",
  refunded: "secondary",
  unpaid: "warn",
  pending: "warn",
  authorized: "info",
};

export function humanizeStatus(value) {
  if (!value) return "-";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDashboardCurrency(value, currency = "NGN") {
  if (value === null || value === undefined || value === "") return "-";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatDashboardNumber(value) {
  if (value === null || value === undefined || value === "") return "0";
  return new Intl.NumberFormat("en-NG").format(Number(value) || 0);
}

export function formatDashboardDate(value, options = {}) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export function formatDashboardDateInput(value) {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}
