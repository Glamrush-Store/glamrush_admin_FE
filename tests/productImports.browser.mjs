import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

// Optional browser check: PLAYWRIGHT_MODULE may point to a bundled Playwright installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const baseURL = process.env.TEST_BASE_URL || "http://localhost:3011";
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
await context.addCookies([{ name: "auth_token", value: "browser-test", url: baseURL }]);
const errors = [];
let details = 0;
let posted = false;
let permissions = ["View_Product", "Create_Product"];
let invalidSubmission = true;
let historyRequests = 0;
const record = {
  id: "import-1", original_filename: "products.csv", status: "pending",
  configuration: { vendor_id: "v1", brand_id: "b1", category_ids: ["c1", "c2"], primary_category_id: "c2", default_status: "draft", image_failure_policy: "warn" },
  progress: { total_rows: 4, total_products: 2, processed_products: 0, imported_products: 0, failed_products: 0, warning_count: 0 },
  issues: [], created_at: "2026-10-15T10:00:00Z", started_at: null, completed_at: null,
};
await context.route("**/api/v1/**", async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname.replace("/api/v1", "");
  let body;
  if (path === "/whoami") body = { data: { name: "Import Test Admin", permissions } };
  else if (path === "/vendors") body = { data: [{ id: "v1", business_name: "Test Vendor" }], meta: { last_page: 1 } };
  else if (path === "/brands") body = { data: [{ id: "b1", name: "Test Brand" }], meta: { last_page: 1 } };
  else if (path === "/categories") body = { data: [{ id: "c1", name: "Fragrance" }, { id: "c2", name: "Perfumes", parent_id: "c1" }], meta: { last_page: 1 } };
  else if (path === "/product-imports/template") return route.fulfill({ status: 200, contentType: "text/csv", body: "name,price\nPerfume,200" });
  else if (path === "/product-imports" && request.method() === "POST") {
    if (invalidSubmission) {
      invalidSubmission = false;
      return route.fulfill({ status: 422, json: { message: "Validation failed", errors: { category_ids: ["The category ids field is required."], primary_category_id: ["The primary category id field is required."] } } });
    }
    assert.match(request.headers()["content-type"], /multipart\/form-data/);
    const payload = request.postDataBuffer().toString();
    for (const field of ["file", "vendor_id", "brand_id", "category_ids[0]", "category_ids[1]", "primary_category_id", "default_status", "image_failure_policy"]) assert.ok(payload.includes(`name="${field}"`));
    assert.ok(!payload.includes('name="category_id"'));
    assert.match(payload, /name="primary_category_id"\r\n\r\nc2/);
    posted = true;
    return route.fulfill({ status: 202, json: { success: true, message: "Product import queued.", data: { id: record.id, status: "pending" } } });
  } else if (path === "/product-imports") { historyRequests++; body = { data: [record], meta: { current_page: 1, per_page: 15, last_page: 1, total: 1 } }; }
  else if (path === "/product-imports/import-1") {
    details++;
    const terminal = details >= 3;
    body = { data: { ...record, status: terminal ? "completed_with_warnings" : "processing", progress: { ...record.progress, processed_products: terminal ? 2 : 1, imported_products: terminal ? 2 : 1, warning_count: terminal ? 1 : 0 }, issues: terminal ? [{ severity: "warning", product_key: "P001", rows: [2], field: "image", value: "https://example.test/image.png", message: "Image unavailable." }] : [] } };
  } else return route.fulfill({ status: 404, json: { message: `Unexpected endpoint: ${path}` } });
  return route.fulfill({ status: 200, json: body });
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "warning" && message.text().includes("Failed to resolve component")) errors.push(message.text()); });
try {
  await page.goto(`${baseURL}/product-imports?create=1`);
  await page.getByRole("dialog").waitFor();
  await page.getByLabel("CSV file (maximum 10 MB)").setInputFiles({ name: "bad.xlsx", mimeType: "application/octet-stream", buffer: Buffer.from("invalid") });
  await page.getByText("Only .csv files are accepted.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Queue import" }).isDisabled(), true);
  await page.getByLabel("CSV file (maximum 10 MB)").setInputFiles({ name: "products.csv", mimeType: "text/csv", buffer: Buffer.from("name,price\nPerfume,200") });
  for (const [label, option] of [["Vendor", "Test Vendor"], ["Brand", "Test Brand"]]) {
    await page.getByLabel(label, { exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  }
  await page.getByLabel("Categories", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Fragrance", exact: true }).check();
  await page.getByRole("button", { name: "Expand category", exact: true }).click();
  await page.getByRole("checkbox", { name: "Perfumes", exact: true }).check();
  await page.getByLabel("Categories", { exact: true }).click();
  await page.getByLabel("Primary category", { exact: true }).click();
  await page.getByRole("option", { name: "Perfumes", exact: true }).click();
  await page.getByRole("button", { name: "Remove Perfumes", exact: true }).click();
  assert.ok((await page.getByLabel("Primary category", { exact: true }).innerText()).includes("Fragrance"));
  await page.getByLabel("Categories", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Perfumes", exact: true }).check();
  await page.getByLabel("Categories", { exact: true }).click();
  await page.getByLabel("Primary category", { exact: true }).click();
  await page.getByRole("option", { name: "Perfumes", exact: true }).click();
  await page.getByRole("listbox").waitFor({ state: "hidden" });
  await page.screenshot({ path: join(tmpdir(), "glamrush-product-import-form.png"), fullPage: true });
  await page.getByRole("button", { name: "Queue import" }).click();
  await page.getByText("The category ids field is required.", { exact: true }).waitFor();
  await page.getByText("The primary category id field is required.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Queue import" }).click();
  await page.waitForURL("**/product-imports/import-1");
  assert.equal(posted, true);
  await page.getByText("Image unavailable.", { exact: true }).waitFor({ timeout: 20000 });
  await page.screenshot({ path: join(tmpdir(), "glamrush-product-import-detail.png"), fullPage: true });
  const callsAtCompletion = details;
  await page.waitForTimeout(3500);
  assert.equal(details, callsAtCompletion, "polling should stop after completion");
  const refreshed = page.waitForResponse("**/product-imports/import-1");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await refreshed;
  assert.equal(details, callsAtCompletion + 1);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: join(tmpdir(), "glamrush-product-import-tablet.png"), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "tablet should not overflow horizontally");
  const suppliedResponse = JSON.parse(await readFile(new URL('./fixtures/product-import-completed.json', import.meta.url), 'utf8'));
  await page.route('**/api/v1/product-imports/import-1', (route) => route.fulfill({ json: suppliedResponse }));
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByText('product-import-sample (2).csv', { exact: true }).waitFor();
  for (const issue of suppliedResponse.data.issues) await page.getByText(issue.message, { exact: true }).waitFor();
  await page.emulateMedia({ colorScheme: 'dark' });
  const detailColors = await page.locator('.import-details dd, .import-details .text-2xl').evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color));
  assert.ok(detailColors.length > 0);
  assert.ok(detailColors.every((color) => color === 'rgb(15, 23, 42)'), 'detail values must remain dark on the light page in dark mode');
  for (const [label, value] of [['Total rows', '4'], ['Total products', '2'], ['Processed', '2'], ['Imported', '1'], ['Failed', '1'], ['Warnings', '2']]) {
    const stat = page.locator('.grid').first().getByText(label, { exact: true }).locator('..').locator('div').last();
    assert.equal(await stat.innerText(), value, `${label}: ${value}`);
  }
  await page.getByRole('button', { name: 'Errors', exact: true }).click();
  const errorRow = page.getByRole('row').filter({ hasText: 'P002' });
  assert.equal(await errorRow.getByRole('cell').nth(2).innerText(), '2, 3, 4');
  assert.equal(await errorRow.getByRole('cell').nth(3).innerText(), '-');
  assert.equal(await errorRow.getByRole('cell').nth(4).innerText(), '-');
  await page.getByRole('button', { name: 'All issues', exact: true }).click();
  await page.screenshot({ path: join(tmpdir(), 'glamrush-product-import-supplied-response.png'), fullPage: true });
  await page.goto(`${baseURL}/product-imports`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV template" }).click();
  assert.equal((await download).suggestedFilename(), "product-import-sample.csv");
  permissions = [];
  const historyBeforeDenied = historyRequests;
  await page.reload();
  await page.getByText("You do not have permission to view product import history.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Import Products", exact: true }).count(), 0);
  assert.equal(await page.getByRole("link", { name: "Product Imports", exact: true }).count(), 0);
  assert.equal(historyRequests, historyBeforeDenied);
  assert.deepEqual(errors, []);
  console.log("Browser checks passed: validation, multipart upload, polling completion, manual refresh, template download, tablet layout.");
  console.log(`Screenshots: ${tmpdir()}\\glamrush-product-import-{form,detail,tablet}.png`);
} catch (error) {
  console.log(await page.locator('body').innerText());
  console.log(await page.getByRole('combobox').evaluateAll((elements) => elements.map((element) => ({ id: element.id, label: element.getAttribute('aria-labelledby'), html: element.outerHTML.slice(0, 450) }))));
  await page.screenshot({ path: join(tmpdir(), 'glamrush-product-import-error.png'), fullPage: true });
  throw error;
} finally { await browser.close(); }
