export const HOMEPAGE_SECTION_ACTIVE_OPTIONS = [
  { label: "Any", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

export const HOMEPAGE_SECTION_SORT_OPTIONS = [
  { label: "Created at", value: "created_at" },
  { label: "Price", value: "price" },
  { label: "Sort order", value: "sort_order" },
  { label: "Name", value: "name" },
];

export const HOMEPAGE_SECTION_DIRECTION_OPTIONS = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

export const HOMEPAGE_SECTION_PERMISSIONS = {
  list: "ViewAny_StorefrontHomepageSection",
  view: "View_StorefrontHomepageSection",
  create: "Create_StorefrontHomepageSection",
  update: "Update_StorefrontHomepageSection",
  delete: "Delete_StorefrontHomepageSection",
};

export function formatHomepageSectionDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHomepageSectionWindow(section) {
  const startsAt = formatHomepageSectionDate(section.starts_at);
  const endsAt = formatHomepageSectionDate(section.ends_at);
  if (startsAt === "-" && endsAt === "-") return "Always";
  return `${startsAt} - ${endsAt}`;
}
