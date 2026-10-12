import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SPLIT_IMAGE_BANNER_TYPE,
  buildSplitImageBannerFormData,
  defaultSplitImageBannerItems,
  hydrateSplitImageBanner,
  orderedSplitItems,
  validateSplitImageBanner,
} from "../app/constants/homepageSections.js";

function image(type = "image/png", size = 10) {
  return new File([new Uint8Array(size)], "banner.png", { type });
}

function entries(formData) {
  return Object.fromEntries([...formData.entries()].filter(([, value]) => typeof value === "string"));
}

describe("split image banner helpers", () => {
  it("hydrates existing images and config items", () => {
    const section = {
      type: SPLIT_IMAGE_BANNER_TYPE,
      images: {
        left: "https://cdn.test/left.webp",
        right: "https://cdn.test/right.webp",
        mobile: "https://cdn.test/mobile.webp",
      },
      config: {
        items: [
          { slot: "right", description: "Right", cta_label: "Shop", cta_url: "/right", sort_order: 1 },
          { slot: "left", description: "Left", sort_order: 0 },
        ],
      },
    };

    const hydrated = hydrateSplitImageBanner(section);

    assert.deepEqual(hydrated.images, {
      left_image: "https://cdn.test/left.webp",
      right_image: "https://cdn.test/right.webp",
      mobile_image: "https://cdn.test/mobile.webp",
    });
    assert.equal(hydrated.items[0].slot, "left");
    assert.equal(hydrated.items[1].cta_enabled, true);
  });

  it("requires all create images", () => {
    const errors = validateSplitImageBanner({
      items: defaultSplitImageBannerItems([
        { slot: "left", description: "Left", sort_order: 0 },
        { slot: "right", description: "Right", sort_order: 1 },
      ]),
      files: {},
      existingImages: {},
      isEditing: false,
    });

    assert.equal(errors.left_image, "Image is required.");
    assert.equal(errors.right_image, "Image is required.");
    assert.equal(errors.mobile_image, "Image is required.");
  });

  it("allows edit submission without re-uploading existing images", () => {
    const errors = validateSplitImageBanner({
      items: defaultSplitImageBannerItems([
        { slot: "left", description: "Left", sort_order: 0 },
        { slot: "right", description: "Right", sort_order: 1 },
      ]),
      files: {},
      existingImages: { left_image: "left", right_image: "right", mobile_image: "mobile" },
      isEditing: true,
    });

    assert.deepEqual(errors, {});
  });

  it("validates descriptions, CTA pairing, duplicate slots, duplicate sort order, and image type", () => {
    const errors = validateSplitImageBanner({
      items: [
        { slot: "left", description: "", cta_label: "Shop", cta_url: "", sort_order: 0 },
        { slot: "left", description: "Right", cta_label: "", cta_url: "/right", sort_order: 0 },
      ],
      files: {
        left_image: image("image/gif"),
        right_image: image(),
        mobile_image: image(),
      },
      isEditing: false,
    });

    assert.equal(errors["config.items"], "Desktop panel sort order values must be unique.");
    assert.equal(errors["config.items.1.slot"], "Use one left slot and one right slot.");
    assert.equal(errors["config.items.0.description"], "Description is required.");
    assert.equal(errors["config.items.0.cta_url"], "CTA URL is required when CTA label is supplied.");
    assert.equal(errors["config.items.1.cta_label"], "CTA label is required when CTA URL is supplied.");
    assert.equal(errors.left_image, "Image must be a JPEG, PNG, or WebP file.");
  });

  it("serializes split image banner FormData in sort order", () => {
    const formData = buildSplitImageBannerFormData({
      form: {
        title: "Split",
        subtitle: "A banner",
        display_order: 4,
        is_active: true,
        starts_at: "2026-10-11T10:00:00.000Z",
        ends_at: null,
      },
      items: [
        { slot: "right", description: "Right", cta_label: "Shop right", cta_url: "/right", sort_order: 1 },
        { slot: "left", description: "Left", cta_label: "", cta_url: "", sort_order: 0 },
      ],
      files: {
        right_image: image(),
      },
      isEditing: true,
    });

    const values = entries(formData);

    assert.equal(values.type, SPLIT_IMAGE_BANNER_TYPE);
    assert.equal(values._method, "PUT");
    assert.equal(values.title, "Split");
    assert.equal(values["config[items][0][slot]"], "left");
    assert.equal(values["config[items][1][slot]"], "right");
    assert.equal(values["config[items][1][cta_label]"], "Shop right");
    assert.equal(formData.has("right_image"), true);
    assert.equal(formData.has("left_image"), false);
    assert.equal(formData.has("mobile_image"), false);
  });

  it("orders items by sort order", () => {
    assert.deepEqual(
      orderedSplitItems([
        { slot: "right", sort_order: 1 },
        { slot: "left", sort_order: 0 },
      ]).map((item) => item.slot),
      ["left", "right"]
    );
  });
});

