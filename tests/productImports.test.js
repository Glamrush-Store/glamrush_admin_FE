import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse, compileScript } from "@vue/compiler-sfc";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import PrimeVue from "primevue/config";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import SelectButton from "primevue/selectbutton";
import { useApiClient } from "../app/composables/apiClient.js";
import {
  productImportSchema, buildProductImportFormData, csvFileError, importProgress,
  createImportPoller, IMPORT_TERMINAL_STATUSES, importStatusSeverity, IMPORT_TEMPLATE_FILENAME,
} from "../app/utils/productImports.js";

const valid = () => ({ file: new File(["name,price\nPerfume,200"], "products.csv", { type: "text/csv" }), vendor_id: "vendor", brand_id: "brand", category_ids: ["category", "second"], primary_category_id: "category", default_status: "draft", image_failure_policy: "warn" });

test("import form validates required configuration, CSV extension and 10 MB limit", async () => {
  await productImportSchema.validate(valid());
  for (const field of ["file", "vendor_id", "brand_id", "category_ids", "primary_category_id", "default_status"]) {
    await assert.rejects(productImportSchema.validate({ ...valid(), [field]: null }));
  }
  await assert.rejects(productImportSchema.validate({ ...valid(), category_ids: [] }));
  await assert.rejects(productImportSchema.validate({ ...valid(), primary_category_id: "unselected" }));
  await assert.rejects(productImportSchema.validate({ ...valid(), default_status: "invalid" }));
  await assert.rejects(productImportSchema.validate({ ...valid(), image_failure_policy: "invalid" }));
  assert.match(csvFileError({ name: "products.xlsx", size: 20 }), /Only .csv/);
  assert.match(csvFileError({ name: "products.csv", size: 10 * 1024 * 1024 + 1 }), /10 MB/);
  assert.equal(csvFileError({ name: "PRODUCTS.CSV", size: 10 * 1024 * 1024 }), "");
});

test("multipart import preserves the original file and sends categories and primary category", async () => {
  const values = valid();
  const data = buildProductImportFormData(values);
  assert.deepEqual([...data.keys()], ["file", "vendor_id", "brand_id", "primary_category_id", "default_status", "image_failure_policy", "category_ids[0]", "category_ids[1]"]);
  assert.equal(await data.get("file").text(), await values.file.text());
  assert.equal(data.get("file").name, "products.csv");
  assert.equal(data.get("category_ids[0]"), "category");
  assert.equal(data.get("category_ids[1]"), "second");
  assert.equal(data.get("primary_category_id"), "category");
  assert.equal(data.has("category_id"), false);
});

test("progress handles zero totals, malformed counts and overshoot", () => {
  assert.equal(importProgress({ total_products: 2, processed_products: 1 }), 50);
  for (const value of [{}, { total_products: 0, processed_products: 1 }, { total_products: "bad", processed_products: 1 }]) assert.equal(importProgress(value), 0);
  assert.equal(importProgress({ total_products: 2, processed_products: 3 }), 100);
});

test("polling repeats at 3 seconds and stops for every terminal status", async () => {
  for (const status of IMPORT_TERMINAL_STATUSES) {
    const states = [{ status: "pending" }, { status: "processing" }, { status }];
    const tasks = new Map();
    let handle = 0;
    const seen = [];
    const poller = createImportPoller({ load: async () => states.shift(), onData: (data) => seen.push(data.status), onError: assert.fail,
      schedule(fn, delay) { assert.equal(delay, 3000); tasks.set(++handle, fn); return handle; }, cancel(id) { tasks.delete(id); } });
    await poller.start();
    while (tasks.size) { const [id, fn] = tasks.entries().next().value; tasks.delete(id); await fn(); }
    assert.deepEqual(seen, ["pending", "processing", status]);
    poller.stop();
  }
  assert.equal(importStatusSeverity("completed_with_warnings"), "warn");
});

test("polling discards in-flight results on teardown and never overlaps refreshes", async () => {
  let resolve;
  let calls = 0;
  let scheduled = 0;
  const poller = createImportPoller({ load() { calls++; return new Promise((done) => { resolve = done; }); }, onData: assert.fail, onError: assert.fail, schedule() { scheduled++; }, cancel() {} });
  const pending = poller.start();
  await poller.refresh();
  poller.stop();
  resolve({ status: "processing" });
  await pending;
  assert.equal(calls, 1);
  assert.equal(scheduled, 0);
});

test("permission errors stop polling; network errors allow another attempt", async () => {
  for (const status of [401, 403, 404, 500]) {
    let scheduled = 0;
    const errors = [];
    const poller = createImportPoller({ load: async () => { throw Object.assign(new Error("Backend message"), { status }); }, onData: assert.fail, onError: (error) => errors.push(error.message), schedule() { scheduled++; }, cancel() {} });
    await poller.start();
    assert.deepEqual(errors, ["Backend message"]);
    assert.equal(scheduled, status === 500 ? 1 : 0);
    poller.stop();
  }
});

test("template download uses authentication and the required filename", async (t) => {
  const anchor = { click() { this.clicked = true; }, remove() {} };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.test/api/v1/product-imports/template");
    assert.equal(options.headers.Authorization, "Bearer token");
    return new Response("name,price", { headers: { "Content-Disposition": 'attachment; filename="other.csv"' } });
  });
  t.mock.method(URL, "createObjectURL", () => "blob:template");
  t.mock.method(URL, "revokeObjectURL", (url) => assert.equal(url, "blob:template"));
  const originals = { useRuntimeConfig: globalThis.useRuntimeConfig, useCookie: globalThis.useCookie, document: globalThis.document };
  Object.assign(globalThis, { useRuntimeConfig: () => ({ public: { apiBase: "https://api.test/api/v1" } }), useCookie: () => ({ value: "token" }), document: { createElement: () => anchor, body: { appendChild() {} } } });
  try {
    assert.equal(await useApiClient().download("/product-imports/template", IMPORT_TEMPLATE_FILENAME), "product-import-sample.csv");
    assert.equal(anchor.download, "product-import-sample.csv");
    assert.equal(anchor.clicked, true);
  } finally { Object.assign(globalThis, originals); }
});

test("issue table renders backend messages, rows, values and safe fallbacks", async () => {
  const filename = new URL("../app/components/product-imports/ProductImportIssues.vue", import.meta.url);
  const { descriptor } = parse(await readFile(filename, "utf8"));
  let { content } = compileScript(descriptor, { id: "issues-test", inlineTemplate: true });
  content = content.replaceAll('from "vue"', `from ${JSON.stringify(import.meta.resolve("vue"))}`)
    .replaceAll('from "~/utils/productImports"', `from ${JSON.stringify(new URL("../app/utils/productImports.js", import.meta.url).href)}`);
  const component = (await import(`data:text/javascript;base64,${Buffer.from(content).toString("base64")}`)).default;
  const app = createSSRApp(component, { issues: [{ severity: "error", product_key: "P002", rows: [3, 4], field: "variant_price", value: "<invalid>", message: "variant_price must be a nonnegative number." }, { severity: "warning", message: "Image unavailable." }, {}] });
  app.use(PrimeVue);
  for (const [name, value] of Object.entries({ DataTable, Column, Tag, SelectButton })) app.component(name, value);
  const html = await renderToString(app);
  for (const text of ["P002", "3, 4", "variant_price must be a nonnegative number.", "Image unavailable.", "&lt;invalid&gt;"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("<invalid>"));
  assert.ok(html.includes(">-<"));
});
