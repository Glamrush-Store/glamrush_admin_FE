export const CONTENT_PAGE_TYPE_OPTIONS = [
  { label: "About Us", value: "about" },
  { label: "Contact", value: "contact" },
  { label: "Privacy Policy", value: "privacy_policy" },
  { label: "Terms and Conditions", value: "terms" },
  { label: "Shipping Policy", value: "shipping_policy" },
  { label: "Returns and Refund Policy", value: "returns_policy" },
  { label: "Custom Page", value: "custom" },
];

export const CONTENT_PAGE_TYPE_LABELS = Object.fromEntries(
  CONTENT_PAGE_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

export const PUBLICATION_STATE_OPTIONS = [
  { label: "All States", value: null },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
  { label: "Unpublished", value: "unpublished" },
  { label: "Expired", value: "expired" },
];

export const PUBLISHED_FILTER_OPTIONS = [
  { label: "Any", value: null },
  { label: "Published flag on", value: true },
  { label: "Published flag off", value: false },
];

export const ACTIVE_FILTER_OPTIONS = [
  { label: "Any", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

export const PUBLICATION_STATE_SEVERITY = {
  draft: "secondary",
  scheduled: "info",
  published: "success",
  unpublished: "warn",
  expired: "danger",
};

export const SOCIAL_PLATFORM_OPTIONS = [
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "X", value: "x" },
  { label: "TikTok", value: "tiktok" },
  { label: "YouTube", value: "youtube" },
  { label: "LinkedIn", value: "linkedin" },
];

export const CONTENT_PERMISSIONS = {
  pages: {
    view: "View_ContentPage",
    create: "Create_ContentPage",
    update: "Update_ContentPage",
    publish: "Publish_ContentPage",
    unpublish: "Unpublish_ContentPage",
    duplicate: "Duplicate_ContentPage",
    delete: "Delete_ContentPage",
  },
  faqCategories: {
    view: "View_FaqCategory",
    create: "Create_FaqCategory",
    update: "Update_FaqCategory",
    reorder: "Reorder_FaqCategory",
    delete: "Delete_FaqCategory",
  },
  faqs: {
    view: "View_Faq",
    create: "Create_Faq",
    update: "Update_Faq",
    publish: "Publish_Faq",
    unpublish: "Unpublish_Faq",
    duplicate: "Duplicate_Faq",
    reorder: "Reorder_Faq",
    delete: "Delete_Faq",
  },
};

export const CONTENT_SORT_FIELDS = {
  pages: ["title", "slug", "page_type", "display_order", "is_published", "published_at", "expires_at", "created_at", "updated_at"],
  faqs: ["question", "display_order", "is_published", "published_at", "expires_at", "created_at", "updated_at"],
};
