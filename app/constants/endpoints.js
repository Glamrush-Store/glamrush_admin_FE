export const AUTH = {
  LOGIN: "/account/login",
  LOGOUT: "/account/logout",
  CREATE_ACCOUNT: "/account/create",
  WHO_AM_I: "/whoami",
  PASSWORD_RESET_REQUEST: "/password/reset/request",
  PASSWORD_RESET_VERIFY: "/password/reset/verify",
  PASSWORD_RESET_CONFIRM: "/password/reset/confirm",
};

export const HEALTH = "/health";

export const DASHBOARD = {
  ANALYTICS: "/dashboard/analytics",
};

export const PRODUCTS = {
  LIST: "/products",
  CREATE: "/products",
  SHOW: (id) => `/products/${id}`,
  UPDATE: (id) => `/products/${id}`,
};

export const CATEGORIES = { LIST: "/categories", CREATE: "/categories", SHOW: (id) => `/categories/${id}`, UPDATE: (id) => `/categories/${id}` };
export const BRANDS = { LIST: "/brands", CREATE: "/brands", SHOW: (id) => `/brands/${id}`, UPDATE: (id) => `/brands/${id}` };
export const VENDORS = { LIST: "/vendors", CREATE: "/vendors", SHOW: (id) => `/vendors/${id}`, UPDATE: (id) => `/vendors/${id}` };

export const VARIANTS = {
  SHOW: (variantId) => `/productvariants/${variantId}`,
  UPDATE: (variantId) => `/productvariants/${variantId}`,
  DELETE: (variantId) => `/productvariants/${variantId}`,
};

export const COLLECTIONS = {
  LIST:   "/collections",
  CREATE: "/collections",
  SHOW:   (id) => `/collections/${id}`,
  UPDATE: (id) => `/collections/${id}`,
  DELETE: (id) => `/collections/${id}`,
  SYNC_PRODUCTS:  (id) => `/collections/${id}/products`,
  REMOVE_PRODUCT: (id, productId) => `/collections/${id}/products/${productId}`,
};

export const SHIPPING_ZONES = {
  LIST:   "/shipping/zones",
  CREATE: "/shipping/zones",
  SHOW:   (id) => `/shipping/zones/${id}`,
  UPDATE: (id) => `/shipping/zones/${id}`,
  DELETE: (id) => `/shipping/zones/${id}`,
};

export const SHIPPING_LOCATION_OPTIONS = {
  COUNTRIES: "/shipping/location-options/countries",
  COUNTRY: (country) => `/shipping/location-options/countries/${country}`,
};

export const SHIPPING_METHODS = {
  LIST:   "/shipping/methods",
  CREATE: "/shipping/methods",
  SHOW:   (id) => `/shipping/methods/${id}`,
  UPDATE: (id) => `/shipping/methods/${id}`,
  DELETE: (id) => `/shipping/methods/${id}`,
};

export const SHIPPING_RATES = {
  LIST:   "/shipping/rates",
  CREATE: "/shipping/rates",
  SHOW:   (id) => `/shipping/rates/${id}`,
  UPDATE: (id) => `/shipping/rates/${id}`,
  DELETE: (id) => `/shipping/rates/${id}`,
};

export const SHIPMENTS = {
  LIST: "/shipments",
  SHOW: (id) => `/shipments/${id}`,
};

export const ORDERS = {
  LIST: "/orders",
  CREATE_MANUAL: "/orders/manual",
  SHOW: (id) => `/orders/${id}`,
  UPDATE_STATUS: (id) => `/orders/${id}/status`,
};

export const MEDIA = {
  DELETE: (id) => `/catalog/media/${id}`,
};

export const CUSTOMERS = {
  LIST: "/customers",
  SHOW: (id) => `/customers/${id}`,
};

export const USERS = {
  LIST: "/users",
  CREATE: "/users",
  SHOW: (id) => `/users/${id}`,
  UPDATE: (id) => `/users/${id}`,
  DELETE: (id) => `/users/${id}`,
};

export const ROLES = {
  LIST: "/roles",
  CREATE: "/roles",
  SHOW: (id) => `/roles/${id}`,
  UPDATE: (id) => `/roles/${id}`,
  DELETE: (id) => `/roles/${id}`,
  SYNC_PERMISSIONS: (id) => `/roles/${id}/permissions`,
};

export const PERMISSIONS = {
  LIST: "/permissions",
};

export const NEWSLETTER_SUBSCRIBERS = {
  LIST: "/newsletter/subscribers",
  SHOW: (id) => `/newsletter/subscribers/${id}`,
  EXPORT: "/newsletter/subscribers/export",
};

export const SKU_ATTRIBUTE_CODES = {
  LIST: "/sku-attribute-code",
  CREATE: "/sku-attribute-code",
  DELETE: (id) => `/sku-attribute-code/${id}`,
  TYPES: "/sku-attribute-code/list/types",
};

export const PAYMENT_METHODS = {
  LIST:   "/payment-methods",
  CREATE: "/payment-methods",
  SHOW:   (id) => `/payment-methods/${id}`,
  UPDATE: (id) => `/payment-methods/${id}`,
  DELETE: (id) => `/payment-methods/${id}`,
};

export const STOREFRONT_CAMPAIGNS = {
  LIST: (storefront) => `/storefronts/${storefront}/campaigns`,
  CREATE: (storefront) => `/storefronts/${storefront}/campaigns`,
  SHOW: (storefront, id) => `/storefronts/${storefront}/campaigns/${id}`,
  UPDATE: (storefront, id) => `/storefronts/${storefront}/campaigns/${id}`,
  DELETE: (storefront, id) => `/storefronts/${storefront}/campaigns/${id}`,
  ENABLE: (storefront, id) => `/storefronts/${storefront}/campaigns/${id}/enable`,
  DISABLE: (storefront, id) => `/storefronts/${storefront}/campaigns/${id}/disable`,
};

export const DISCOUNT_CODES = {
  LIST: "/discount-codes",
  CREATE: "/discount-codes",
  SHOW: (id) => `/discount-codes/${id}`,
  UPDATE: (id) => `/discount-codes/${id}`,
  ACTIVATE: (id) => `/discount-codes/${id}/activate`,
  DEACTIVATE: (id) => `/discount-codes/${id}/deactivate`,
  DUPLICATE: (id) => `/discount-codes/${id}/duplicate`,
};

export const CONTENT_PAGES = {
  LIST: "/content-pages",
  CREATE: "/content-pages",
  SHOW: (id) => `/content-pages/${id}`,
  UPDATE: (id) => `/content-pages/${id}`,
  PUBLISH: (id) => `/content-pages/${id}/publish`,
  UNPUBLISH: (id) => `/content-pages/${id}/unpublish`,
  DUPLICATE: (id) => `/content-pages/${id}/duplicate`,
  DELETE: (id) => `/content-pages/${id}`,
};

export const FAQ_CATEGORIES = {
  LIST: "/faq-categories",
  CREATE: "/faq-categories",
  SHOW: (id) => `/faq-categories/${id}`,
  UPDATE: (id) => `/faq-categories/${id}`,
  DELETE: (id) => `/faq-categories/${id}`,
  REORDER: "/faq-categories/reorder",
};

export const FAQS = {
  LIST: "/faqs",
  CREATE: "/faqs",
  SHOW: (id) => `/faqs/${id}`,
  UPDATE: (id) => `/faqs/${id}`,
  PUBLISH: (id) => `/faqs/${id}/publish`,
  UNPUBLISH: (id) => `/faqs/${id}/unpublish`,
  DUPLICATE: (id) => `/faqs/${id}/duplicate`,
  DELETE: (id) => `/faqs/${id}`,
  REORDER: "/faqs/reorder",
};
