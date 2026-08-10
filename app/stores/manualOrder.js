import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import {
  CUSTOMERS,
  ORDERS,
  PAYMENT_METHODS,
  PRODUCTS,
  SHIPPING_METHODS,
  SHIPPING_RATES,
  SHIPPING_ZONES,
} from "~/constants/endpoints";

function unwrapList(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function unwrapItem(response) {
  return response?.data?.data || response?.data || null;
}

function unwrapMeta(response) {
  return response?.meta || response?.data?.meta || {};
}

function moneyValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function labelFromAttributes(attributes) {
  if (!attributes) return "";
  if (Array.isArray(attributes)) {
    return attributes
      .map((item) => item?.label || item?.name || item?.value || item?.attribute_value || item)
      .filter(Boolean)
      .join(" / ");
  }

  if (typeof attributes === "object") {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value?.label || value?.name || value}`)
      .join(" / ");
  }

  return String(attributes);
}

function salePriceIsActive(pricing) {
  if (!pricing?.sale_price) return false;
  const now = new Date();
  const startsAt = pricing.sale_starts_at ? new Date(pricing.sale_starts_at) : null;
  const endsAt = pricing.sale_ends_at ? new Date(pricing.sale_ends_at) : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
}

function currentPrice(product, variant) {
  const pricing = variant?.pricing || {};
  if (salePriceIsActive(pricing)) return pricing.sale_price;
  return pricing.price || variant?.price || product?.price || product?.sale_price || 0;
}

function normalizeProduct(product) {
  return {
    ...product,
    label: [product?.name || product?.title || "Product", product?.type, product?.price ? `NGN ${product.price}` : ""]
      .filter(Boolean)
      .join(" - "),
  };
}

function normalizeVariant(product, variant) {
  const price = currentPrice(product, variant);
  const stock = Number(
    variant?.available_stock ??
      variant?.inventory?.available_stock ??
      variant?.inventory?.stock_quantity ??
      variant?.stock_quantity ??
      product?.inventory?.stock_quantity ??
      product?.stock_quantity ??
      0
  );
  const reserved = Number(variant?.inventory?.reserved_quantity ?? variant?.reserved_quantity ?? 0);
  const attributes = labelFromAttributes(
    variant?.attributes || variant?.attribute_values || variant?.options || variant?.option_values
  );
  const sku = variant?.sku || product?.sku || "-";
  const productName = product?.name || product?.title || "Product";
  const variantName = variant?.name || attributes;

  return {
    id: variant?.id || product?.default_variant_id,
    product_id: product?.id,
    product_name: productName,
    variant_name: variantName,
    sku,
    price: moneyValue(price),
    stock: Math.max(0, stock - reserved),
    manage_stock: Boolean(variant?.inventory?.manage_stock),
    disabled: variant?.inventory?.in_stock === false,
    is_default: Boolean(variant?.is_default),
    label: [productName, variantName, sku !== "-" ? sku : ""].filter(Boolean).join(" - "),
  };
}

export const useManualOrderStore = defineStore("manualOrder", () => {
  const customers = ref([]);
  const products = ref([]);
  const productPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const variantOptions = ref([]);
  const selectedProduct = ref(null);
  const paymentMethods = ref([]);
  const shippingMethods = ref([]);
  const shippingZones = ref([]);
  const shippingRates = ref([]);
  const loadingCustomers = ref(false);
  const loadingProducts = ref(false);
  const loadingProductDetails = ref(false);
  const loadingSetup = ref(false);
  const loadingRates = ref(false);
  const submitting = ref(false);
  const selectorError = ref(null);
  const productError = ref(null);
  const productDetailError = ref(null);
  const noEligibleVariantsMessage = ref(null);
  const submitError = ref(null);
  const conflictError = ref(null);
  const validationErrors = ref({});
  const idempotencyKey = ref(uuidv4());

  function resetSubmissionState() {
    submitError.value = null;
    conflictError.value = null;
    validationErrors.value = {};
  }

  function resetIdempotencyKey() {
    idempotencyKey.value = uuidv4();
  }

  async function fetchCustomers(search = "") {
    loadingCustomers.value = true;
    selectorError.value = null;
    try {
      const api = useApiClient();
      const params = new URLSearchParams({ page: "1", per_page: "20" });
      if (search) params.set("search", search);
      const response = await api.get(`${CUSTOMERS.LIST}?${params.toString()}`);
      customers.value = unwrapList(response);
    } catch (err) {
      selectorError.value = err.message || "Unable to load customers";
      customers.value = [];
    } finally {
      loadingCustomers.value = false;
    }
  }

  async function fetchProducts({ search = "", page = 1, append = false } = {}) {
    loadingProducts.value = true;
    productError.value = null;
    try {
      const api = useApiClient();
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) params.set("search", search);
      const response = await api.get(`${PRODUCTS.LIST}?${params.toString()}`);
      const publishedProducts = unwrapList(response)
        .filter((product) => !product?.status || product.status === "published")
        .map(normalizeProduct);
      products.value = append ? [...products.value, ...publishedProducts] : publishedProducts;
      const meta = unwrapMeta(response);
      productPagination.value = {
        current_page: meta.current_page || page,
        last_page: meta.last_page || page,
        per_page: meta.per_page || 20,
        total: meta.total || products.value.length,
      };
    } catch (err) {
      productError.value =
        err.status === 403
          ? "You do not have permission to view products."
          : "Products could not be loaded. Try again.";
      if (!append) products.value = [];
    } finally {
      loadingProducts.value = false;
    }
  }

  async function fetchProductVariants(productId) {
    if (!productId) {
      selectedProduct.value = null;
      variantOptions.value = [];
      return [];
    }

    loadingProductDetails.value = true;
    productDetailError.value = null;
    noEligibleVariantsMessage.value = null;
    variantOptions.value = [];
    try {
      const api = useApiClient();
      const response = await api.get(PRODUCTS.SHOW(productId));
      const product = unwrapItem(response);
      selectedProduct.value = product;
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      variantOptions.value = variants
        .filter((variant) => variant?.status === "active")
        .map((variant) => normalizeVariant(product, variant));

      if (!variantOptions.value.length) {
        noEligibleVariantsMessage.value = "This product has no active variants available for sale.";
      }

      return variantOptions.value;
    } catch (err) {
      productDetailError.value =
        err.status === 403
          ? "You do not have permission to view products."
          : "Product variants could not be loaded. Try again.";
      selectedProduct.value = null;
      variantOptions.value = [];
      return [];
    } finally {
      loadingProductDetails.value = false;
    }
  }

  async function fetchSetupOptions() {
    loadingSetup.value = true;
    selectorError.value = null;
    try {
      const api = useApiClient();
      const query = "page=1&per_page=100&is_active=1";
      const [paymentResponse, methodResponse, zoneResponse] = await Promise.all([
        api.get(`${PAYMENT_METHODS.LIST}?${query}`),
        api.get(`${SHIPPING_METHODS.LIST}?${query}`),
        api.get(`${SHIPPING_ZONES.LIST}?${query}`),
      ]);

      paymentMethods.value = unwrapList(paymentResponse);
      shippingMethods.value = unwrapList(methodResponse);
      shippingZones.value = unwrapList(zoneResponse);
    } catch (err) {
      selectorError.value = err.message || "Unable to load setup options";
      paymentMethods.value = [];
      shippingMethods.value = [];
      shippingZones.value = [];
    } finally {
      loadingSetup.value = false;
    }
  }

  async function fetchShippingRates({ shippingMethodId, shippingZoneId }) {
    if (!shippingMethodId || !shippingZoneId) {
      shippingRates.value = [];
      return;
    }

    loadingRates.value = true;
    selectorError.value = null;
    try {
      const api = useApiClient();
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        is_active: "1",
        shipping_method_id: String(shippingMethodId),
        shipping_zone_id: String(shippingZoneId),
      });
      const response = await api.get(`${SHIPPING_RATES.LIST}?${params.toString()}`);
      shippingRates.value = unwrapList(response);
    } catch (err) {
      selectorError.value = err.message || "Unable to load shipping rates";
      shippingRates.value = [];
    } finally {
      loadingRates.value = false;
    }
  }

  async function createManualOrder(payload) {
    submitting.value = true;
    resetSubmissionState();
    try {
      const api = useApiClient();
      const response = await api.post(ORDERS.CREATE_MANUAL, payload, {
        headers: { "Idempotency-Key": idempotencyKey.value },
      });
      resetIdempotencyKey();
      return response;
    } catch (err) {
      if (err.status === 409) {
        conflictError.value = err.message || "This manual order has already been submitted.";
      } else if (err.status === 422) {
        validationErrors.value = err.errors || {};
        submitError.value = err.message || "Please correct the highlighted fields.";
      } else {
        submitError.value = err.message || "Unable to create manual order";
      }
      throw err;
    } finally {
      submitting.value = false;
    }
  }

  return {
    customers,
    products,
    productPagination,
    variantOptions,
    selectedProduct,
    paymentMethods,
    shippingMethods,
    shippingZones,
    shippingRates,
    loadingCustomers,
    loadingProducts,
    loadingProductDetails,
    loadingSetup,
    loadingRates,
    submitting,
    selectorError,
    productError,
    productDetailError,
    noEligibleVariantsMessage,
    submitError,
    conflictError,
    validationErrors,
    idempotencyKey,
    resetIdempotencyKey,
    resetSubmissionState,
    fetchCustomers,
    fetchProducts,
    fetchProductVariants,
    fetchSetupOptions,
    fetchShippingRates,
    createManualOrder,
  };
});
