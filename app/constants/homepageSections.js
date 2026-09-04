export const HOMEPAGE_SECTION_TYPES = [
  { label: "Hero", value: "hero" },
  { label: "Product grid", value: "product_grid" },
  { label: "Category grid", value: "category_grid" },
  { label: "Collection", value: "collection" },
  { label: "Banner", value: "banner" },
  { label: "Editorial", value: "editorial" },
];

export const HOMEPAGE_SECTION_TYPE_LABELS = Object.fromEntries(
  HOMEPAGE_SECTION_TYPES.map((option) => [option.value, option.label]),
);

export const HOMEPAGE_SECTION_ACTIVE_OPTIONS = [
  { label: "Any", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
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
