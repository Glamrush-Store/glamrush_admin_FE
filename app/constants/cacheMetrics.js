export const CACHE_METRICS_PERMISSIONS = {
  view: "View_Dashboard",
  update: "Update_Dashboard",
};

export const CACHE_SERVICE_OPTIONS = [
  { label: "All", value: null },
  { label: "Backend service", value: "backend_service" },
  { label: "Admin service", value: "admin_service" },
];

export const CACHE_FLUSH_SERVICE_OPTIONS = [
  { label: "Backend service", value: "backend_service" },
  { label: "Admin service", value: "admin_service" },
  { label: "Both services", value: "all" },
];

export const CACHE_AREA_OPTIONS = [
  { label: "All", value: null },
  { label: "Catalog", value: "catalog" },
  { label: "Content", value: "content" },
  { label: "Search", value: "search" },
  { label: "Settings", value: "settings" },
  { label: "Dashboard", value: "dashboard" },
  { label: "Orders", value: "orders" },
  { label: "Cart", value: "cart" },
  { label: "Checkout", value: "checkout" },
  { label: "Payment", value: "payment" },
  { label: "Shipping", value: "shipping" },
  { label: "Auth", value: "auth" },
  { label: "Location", value: "location" },
  { label: "Other", value: "other" },
];

export const CACHE_SORT_OPTIONS = [
  { label: "Oldest first", value: "asc" },
  { label: "Newest first", value: "desc" },
];

export const REDIS_HEALTH_FIELDS = [
  { label: "Used memory", key: "used_memory_human" },
  { label: "Peak memory", key: "used_memory_peak" },
  { label: "Connected clients", key: "connected_clients" },
  { label: "Blocked clients", key: "blocked_clients" },
  { label: "Keyspace hits", key: "keyspace_hits" },
  { label: "Keyspace misses", key: "keyspace_misses" },
  { label: "Expired keys", key: "expired_keys" },
  { label: "Evicted keys", key: "evicted_keys" },
  { label: "Commands processed", key: "total_commands_processed" },
  { label: "Ops/sec", key: "instantaneous_ops_per_sec" },
];

export function getDefaultCacheMetricRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function formatCacheNumber(value) {
  if (value === null || value === undefined || value === "") return "0";
  return new Intl.NumberFormat("en-NG").format(Number(value) || 0);
}

export function formatCachePercent(value) {
  if (value === null || value === undefined || value === "") return "0.00%";
  return `${Number(value || 0).toFixed(2)}%`;
}

export function formatCacheDate(value, options = {}) {
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

export function humanizeCacheValue(value) {
  if (!value) return "-";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
