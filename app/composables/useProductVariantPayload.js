const BOOLEAN_FIELDS = ["manage_stock", "in_stock", "is_default"];

function appendIfPresent(formData, key, value) {
  if (value === null || value === undefined || value === "") return;
  formData.append(key, value);
}

function dateToIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function hasProductVariantPhotos(payload) {
  return Array.isArray(payload?.photos) && payload.photos.length > 0;
}

export function normalizeProductVariantPayload(payload) {
  return {
    price: payload.price,
    sale_price: payload.sale_price ?? null,
    sale_starts_at: dateToIso(payload.sale_starts_at),
    sale_ends_at: dateToIso(payload.sale_ends_at),
    manage_stock: Boolean(payload.manage_stock),
    stock_quantity: payload.stock_quantity ?? 0,
    in_stock: Boolean(payload.in_stock),
    is_default: Boolean(payload.is_default),
    status: payload.status || "active",
    sort_order: payload.sort_order ?? null,
    attributes: (payload.attributes || []).map((attribute) => ({
      type: attribute.type,
      value: attribute.value,
    })),
  };
}

export function buildProductVariantFormData(payload) {
  const formData = new FormData();
  const normalized = normalizeProductVariantPayload(payload);

  Object.entries(normalized).forEach(([key, value]) => {
    if (key === "attributes") {
      value.forEach((attribute, index) => {
        formData.append(`attributes[${index}][type]`, attribute.type);
        formData.append(`attributes[${index}][value]`, attribute.value);
      });
      return;
    }

    if (BOOLEAN_FIELDS.includes(key)) {
      formData.append(key, value ? "1" : "0");
      return;
    }

    appendIfPresent(formData, key, value);
  });

  (payload.photos || []).forEach((photo, index) => {
    formData.append(`photos[${index}]`, photo.file || photo);
  });

  return formData;
}

