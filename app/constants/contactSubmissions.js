/**
 * @typedef {"new" | "in_progress" | "resolved" | "spam"} ContactSubmissionStatus
 */

export const CONTACT_SUBMISSION_PERMISSIONS = {
  list: "ViewAny_ContactSubmission",
  view: "View_ContactSubmission",
  update: "Update_ContactSubmission",
};

export const CONTACT_SUBMISSION_STATUS_OPTIONS = [
  { label: "New", value: "new", severity: "info" },
  { label: "In progress", value: "in_progress", severity: "warn" },
  { label: "Resolved", value: "resolved", severity: "success" },
  { label: "Spam", value: "spam", severity: "danger" },
];

export const CONTACT_SUBMISSION_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "resolved_at",
  "status",
  "name",
  "email",
  "subject",
];

export function contactSubmissionStatusLabel(status) {
  return CONTACT_SUBMISSION_STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "-";
}

export function contactSubmissionStatusSeverity(status) {
  return CONTACT_SUBMISSION_STATUS_OPTIONS.find((option) => option.value === status)?.severity || "secondary";
}

export function formatContactSubmissionDate(value, includeTime = true) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(value));
}

