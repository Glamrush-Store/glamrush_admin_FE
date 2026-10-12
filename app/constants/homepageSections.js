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

export const SPLIT_IMAGE_BANNER_TYPE = "split_image_banner";

export const SPLIT_IMAGE_BANNER_SLOTS = [
  { label: "Left desktop panel", value: "left", imageField: "left_image" },
  { label: "Right desktop panel", value: "right", imageField: "right_image" },
];

export const SPLIT_IMAGE_BANNER_IMAGE_FIELDS = ["left_image", "right_image", "mobile_image"];
export const SPLIT_IMAGE_BANNER_ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SPLIT_IMAGE_BANNER_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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

export function defaultSplitImageBannerItems(currentItems = []) {
  const source = Array.isArray(currentItems) ? currentItems : [];

  return ["left", "right"].map((slot, index) => {
    const existing = source.find((item) => item?.slot === slot) || {};
    const ctaLabel = existing.cta_label || "";
    const ctaUrl = existing.cta_url || "";

    return {
      slot,
      description: existing.description || "",
      cta_enabled: Boolean(ctaLabel || ctaUrl),
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      sort_order: Number(existing.sort_order ?? index),
    };
  });
}

export function splitImagesFromSection(section = {}) {
  const images = section.images || section.data?.images || {};

  return {
    left_image: images.left || images.left_image || null,
    right_image: images.right || images.right_image || null,
    mobile_image: images.mobile || images.mobile_image || null,
  };
}

export function hydrateSplitImageBanner(section = {}) {
  return {
    items: defaultSplitImageBannerItems(section.config?.items || section.items || []),
    images: splitImagesFromSection(section),
  };
}

export function orderedSplitItems(items = []) {
  return [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export function validateSplitImageBanner({ items = [], files = {}, existingImages = {}, isEditing = false } = {}) {
  const errors = {};
  const sortedItems = orderedSplitItems(items);
  const slots = sortedItems.map((item) => item.slot).filter(Boolean);
  const sortOrders = sortedItems.map((item) => Number(item.sort_order));

  if (sortedItems.length !== 2) {
    errors["config.items"] = "Split image banner requires exactly two desktop panels.";
  }

  if (new Set(slots).size !== slots.length || !slots.includes("left") || !slots.includes("right")) {
    errors["config.items"] = "Desktop panels must use one left slot and one right slot.";
    sortedItems.forEach((item, index) => {
      if (!["left", "right"].includes(item.slot) || slots.filter((slot) => slot === item.slot).length > 1) {
        errors[`config.items.${index}.slot`] = "Use one left slot and one right slot.";
      }
    });
  }

  if (sortOrders.some((value) => !Number.isInteger(value) || value < 0)) {
    errors["config.items"] = "Sort order values must be whole numbers greater than or equal to 0.";
  } else if (new Set(sortOrders).size !== sortOrders.length) {
    errors["config.items"] = "Desktop panel sort order values must be unique.";
  }

  sortedItems.forEach((item, index) => {
    if (!item.slot) errors[`config.items.${index}.slot`] = "Slot is required.";
    if (!String(item.description || "").trim()) {
      errors[`config.items.${index}.description`] = "Description is required.";
    }

    const label = String(item.cta_label || "").trim();
    const url = String(item.cta_url || "").trim();
    if (label && !url) errors[`config.items.${index}.cta_url`] = "CTA URL is required when CTA label is supplied.";
    if (url && !label) errors[`config.items.${index}.cta_label`] = "CTA label is required when CTA URL is supplied.";
  });

  SPLIT_IMAGE_BANNER_IMAGE_FIELDS.forEach((field) => {
    if (!isEditing && !files[field] && !existingImages[field]) {
      errors[field] = "Image is required.";
      return;
    }

    const file = files[field];
    if (!file) return;

    if (file.type && !SPLIT_IMAGE_BANNER_ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      errors[field] = "Image must be a JPEG, PNG, or WebP file.";
      return;
    }

    if (file.size > SPLIT_IMAGE_BANNER_MAX_IMAGE_BYTES) {
      errors[field] = "Image must be 10 MB or smaller.";
    }
  });

  return errors;
}

export function appendNullable(formData, key, value) {
  if (value === null || value === undefined || value === "") return;
  formData.append(key, value);
}

export function buildSplitImageBannerFormData({
  form,
  items,
  files = {},
  isEditing = false,
}) {
  const formData = new FormData();
  formData.append("type", SPLIT_IMAGE_BANNER_TYPE);
  formData.append("title", String(form.title || "").trim());
  appendNullable(formData, "subtitle", form.subtitle ? String(form.subtitle).trim() : null);
  formData.append("display_order", String(Number(form.display_order || 0)));
  formData.append("is_active", form.is_active ? "1" : "0");
  appendNullable(formData, "starts_at", form.starts_at);
  appendNullable(formData, "ends_at", form.ends_at);

  orderedSplitItems(items).forEach((item, index) => {
    formData.append(`config[items][${index}][slot]`, item.slot);
    formData.append(`config[items][${index}][description]`, String(item.description || "").trim());
    appendNullable(formData, `config[items][${index}][cta_label]`, item.cta_label ? String(item.cta_label).trim() : null);
    appendNullable(formData, `config[items][${index}][cta_url]`, item.cta_url ? String(item.cta_url).trim() : null);
    formData.append(`config[items][${index}][sort_order]`, String(Number(item.sort_order || 0)));
  });

  SPLIT_IMAGE_BANNER_IMAGE_FIELDS.forEach((field) => {
    if (files[field]) formData.append(field, files[field]);
  });

  if (isEditing) formData.append("_method", "PUT");
  return formData;
}
