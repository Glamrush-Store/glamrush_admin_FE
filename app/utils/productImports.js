import { array, mixed, object, string } from "yup";

export const IMPORT_ACTIVE_STATUSES = ["pending", "processing"];
export const IMPORT_TERMINAL_STATUSES = ["completed", "completed_with_warnings", "completed_with_errors", "failed"];
export const IMPORT_STATUS_OPTIONS = ["draft", "published", "archived"];
export const IMPORT_IMAGE_POLICIES = ["warn", "fail_product"];
export const IMPORT_TEMPLATE_FILENAME = "product-import-sample.csv";

export function csvFileError(file) {
  if (!file) return "Select a CSV file.";
  if (!/\.csv$/i.test(file.name || "")) return "Only .csv files are accepted.";
  if (file.size > 10 * 1024 * 1024) return "CSV file must be 10 MB or smaller.";
  return "";
}

export const productImportSchema = object({
  file: mixed().required("Select a CSV file.").test("csv", "Invalid CSV file", function (file) {
    const message = csvFileError(file);
    return message ? this.createError({ message }) : true;
  }),
  vendor_id: string().required("Vendor is required."),
  brand_id: string().required("Brand is required."),
  category_ids: array().of(string().required()).min(1, "Select at least one category.").required("Select at least one category."),
  primary_category_id: string().required("Primary category is required.").test("selected-category", "The primary category must be included in category_ids.", function (value) {
    return this.parent.category_ids?.includes(value) || false;
  }),
  default_status: string().required().oneOf(IMPORT_STATUS_OPTIONS),
  image_failure_policy: string().required().oneOf(IMPORT_IMAGE_POLICIES),
});

export function buildProductImportFormData(values) {
  const data = new FormData();
  for (const field of ["file", "vendor_id", "brand_id", "primary_category_id", "default_status", "image_failure_policy"]) {
    data.append(field, values[field]);
  }
  values.category_ids.forEach((id, index) => data.append(`category_ids[${index}]`, id));
  return data;
}

export function importProgress(progress = {}) {
  const total = Number(progress.total_products);
  const processed = Number(progress.processed_products);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(processed)) return 0;
  return Math.min(100, Math.max(0, Math.round(processed / total * 100)));
}

export function importStatusSeverity(status) {
  return ({ pending: "secondary", processing: "info", completed: "success", completed_with_warnings: "warn", completed_with_errors: "danger", failed: "danger" })[status] || "secondary";
}

export function importStatusLabel(status) {
  return String(status || "Unknown").replaceAll("_", " ");
}

export function importStatusStyle(status) {
  const colors = { pending: "#475569", processing: "#1d4ed8", completed: "#166534", completed_with_warnings: "#92400e", completed_with_errors: "#b91c1c", failed: "#b91c1c" };
  return { backgroundColor: colors[status] || colors.pending, color: "#ffffff" };
}

export function formatImportDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "medium" });
}

export function issueText(value) {
  if (value === undefined || value === null || value === "") return "-";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function issueRows(issue) {
  return Array.isArray(issue.rows) && issue.rows.length ? issue.rows.join(", ") : "-";
}

// Schedule after each response so slow requests never overlap.
export function createImportPoller({ load, onData, onError, schedule = setTimeout, cancel = clearTimeout }) {
  let timer;
  let stopped = true;
  let inFlight = false;
  let generation = 0;
  async function refresh() {
    if (stopped || inFlight) return;
    cancel(timer);
    inFlight = true;
    const current = generation;
    try {
      const data = await load();
      if (stopped || current !== generation) return;
      onData(data);
      if (IMPORT_ACTIVE_STATUSES.includes(data.status)) timer = schedule(refresh, 3000);
    } catch (error) {
      if (stopped || current !== generation) return;
      onError(error);
      if (![401, 403, 404].includes(error.status)) timer = schedule(refresh, 3000);
    } finally {
      inFlight = false;
    }
  }
  return {
    start() { stopped = false; return refresh(); },
    refresh,
    stop() { stopped = true; generation++; cancel(timer); },
  };
}
