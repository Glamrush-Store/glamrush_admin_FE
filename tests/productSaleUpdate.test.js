import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { parse, compileScript } from "@vue/compiler-sfc";

const source = await readFile(new URL("../app/pages/products/[id]/edit.vue", import.meta.url), "utf8");
const { descriptor } = parse(source);
const script = compileScript(descriptor, { id: "product-sale-update-test" });
const submitNode = script.scriptSetupAst.find((node) => node.type === "FunctionDeclaration" && node.id.name === "onSubmit");
const submitSource = descriptor.scriptSetup.content.slice(submitNode.start, submitNode.end);

async function submitSale(pricing, withImage) {
  let sent;
  const state = {
    pricing: { price: 3000, ...pricing },
    productType: { value: "simple" },
    inventory: { stock_quantity: 20, manage_stock: true, in_stock: true },
    descriptionHtml: { value: "" },
    validationErrors: { value: {} }, loading: { value: false }, serverError: { value: "" },
    isFeatured: { value: false }, sortOrder: { value: 0 }, orderedCategoryIds: { value: ["category"] },
    newImages: { value: withImage ? [{ file: new File(["image"], "photo.png") }] : [] },
    validateCategoryAssignment: () => ({}), validateSaleFields: () => ({}),
    appendCategoryPayload: () => {}, buildCategoryPayload: () => ({}),
    FormData, id: "product", PRODUCTS: { UPDATE: () => "/products/product" },
    useApiClient: () => ({ putFormData: async (_, payload) => { sent = payload; } }),
    productStore: { updateProduct: async (_, payload) => { sent = payload; } },
    navigateTo: () => {}, ApiError: Error,
  };
  const submit = runInNewContext(`(${submitSource})`, state);
  await submit({ valid: true, values: { name: "Love body Mist", status: "published", brand_id: "brand", vendor_id: "vendor" } });
  assert.equal(state.serverError.value, "");
  assert.ok(sent);
  return sent;
}

test("cleared sale fields remain present as null in the product JSON update", async () => {
  for (const empty of [null, "", undefined]) {
    const payload = await submitSale({ sale_price: empty, sale_starts_at: empty, sale_ends_at: empty }, false);
    const serialized = JSON.parse(JSON.stringify(payload));
    for (const key of ["sale_price", "sale_starts_at", "sale_ends_at"]) {
      assert.equal(Object.hasOwn(serialized, key), true);
      assert.equal(serialized[key], null);
    }
  }
});

test("cleared sale fields remain present as empty multipart fields when uploading photos", async () => {
  const payload = await submitSale({ sale_price: null, sale_starts_at: null, sale_ends_at: null }, true);
  for (const key of ["sale_price", "sale_starts_at", "sale_ends_at"]) assert.equal(payload.get(key), "");
  assert.equal(payload.has("photos[]"), true);
});

test("existing sale values and ISO timestamps are preserved in both update paths", async () => {
  const pricing = { sale_price: 2500, sale_starts_at: new Date("2026-11-01T00:00:00Z"), sale_ends_at: new Date("2026-11-02T00:00:00Z") };
  for (const withImage of [false, true]) {
    const payload = await submitSale(pricing, withImage);
    const value = (key) => withImage ? payload.get(key) : payload[key];
    assert.equal(Number(value("sale_price")), 2500);
    assert.equal(value("sale_starts_at"), pricing.sale_starts_at.toISOString());
    assert.equal(value("sale_ends_at"), pricing.sale_ends_at.toISOString());
  }
});
