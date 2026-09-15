export const ATTRIBUTE_TYPE_PERMISSIONS = {
  list: "ViewAny_AttributeType",
  view: "View_AttributeType",
  create: "Create_AttributeType",
  update: "Update_AttributeType",
  delete: "Delete_AttributeType",
};

export const ATTRIBUTE_TYPE_SORT_FIELDS = [
  "id",
  "category",
  "value",
  "label",
  "display_type",
  "created_at",
  "updated_at",
];

export const ATTRIBUTE_TYPE_SORT_FIELD_OPTIONS = [
  { label: "Category", value: "category" },
  { label: "Value", value: "value" },
  { label: "Label", value: "label" },
  { label: "Display type", value: "display_type" },
  { label: "Created at", value: "created_at" },
  { label: "Updated at", value: "updated_at" },
];

export const ATTRIBUTE_TYPE_SORT_DIR_OPTIONS = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

export function normalizeAttributeTypeSortField(field) {
  return ATTRIBUTE_TYPE_SORT_FIELDS.includes(field) ? field : "value";
}

export function normalizeAttributeTypeSortDir(direction) {
  return direction === "desc" ? "desc" : "asc";
}

