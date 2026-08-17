export function slugifyContentValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function sanitizeAdminPreviewHtml(value) {
  if (!import.meta.client) return "";

  const template = document.createElement("template");
  template.innerHTML = String(value || "");
  const blockedTags = ["script", "iframe", "object", "embed", "style", "link", "meta", "base", "form", "input", "button"];

  template.content.querySelectorAll(blockedTags.join(",")).forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const val = attribute.value.toLowerCase().trim();
      if (name.startsWith("on") || val.startsWith("javascript:") || val.includes("data:image")) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return template.innerHTML;
}

export function previewSrcDoc({ title, excerpt, html, settings }) {
  const safeContent = sanitizeAdminPreviewHtml(html);
  const safeTitle = sanitizeAdminPreviewHtml(title);
  const safeExcerpt = sanitizeAdminPreviewHtml(excerpt);
  const contactHtml = settings
    ? `<section class="contact"><h2>Contact information</h2>${settings.email ? `<p>Email: ${sanitizeAdminPreviewHtml(settings.email)}</p>` : ""}${settings.phone ? `<p>Phone: ${sanitizeAdminPreviewHtml(settings.phone)}</p>` : ""}${settings.whatsapp ? `<p>WhatsApp: ${sanitizeAdminPreviewHtml(settings.whatsapp)}</p>` : ""}${settings.business_hours ? `<p>Hours: ${sanitizeAdminPreviewHtml(settings.business_hours)}</p>` : ""}${settings.address ? `<p>Address: ${sanitizeAdminPreviewHtml(settings.address)}</p>` : ""}</section>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Inter,Arial,sans-serif;line-height:1.65;color:#0f172a;margin:0;padding:32px;background:#fff}main{max-width:820px;margin:auto}h1{font-size:32px;margin:0 0 10px}h2{font-size:22px;margin-top:28px}blockquote{border-left:4px solid #cbd5e1;margin-left:0;padding-left:16px;color:#475569}.excerpt{color:#475569;font-size:16px}.notice{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:24px;color:#334155;font-size:14px}.contact{border-top:1px solid #e2e8f0;margin-top:28px;padding-top:18px}</style></head><body><main><div class="notice">Administrative preview. Public visibility still depends on backend publication, schedule, and storefront checks.</div><h1>${safeTitle || "Untitled"}</h1>${safeExcerpt ? `<p class="excerpt">${safeExcerpt}</p>` : ""}<article>${safeContent}</article>${contactHtml}</main></body></html>`;
}
