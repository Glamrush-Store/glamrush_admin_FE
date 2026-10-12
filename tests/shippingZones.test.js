import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildZonePayload,
  coverageSummary,
  listCoverageSummary,
  selectedCities,
  selectedStateValues,
} from "../app/constants/shippingZones.js";

describe("shipping zone location helpers", () => {
  it("builds a country-wide payload with empty states and cities arrays", () => {
    const payload = buildZonePayload(
      { name: "Nigeria", country: "NGA" },
      [],
      [],
      true,
      ""
    );

    assert.deepEqual(payload, {
      name: "Nigeria",
      country: "NGA",
      states: [],
      cities: [],
      postal_code_pattern: null,
      is_active: true,
    });
  });

  it("omits redundant city selections when the state is already selected", () => {
    const payload = buildZonePayload(
      { name: "South West", country: "NGA" },
      ["LA"],
      [
        { state: "LA", city: "Ikeja" },
        { state: "OG", city: "Abeokuta" },
      ],
      true,
      null
    );

    assert.deepEqual(payload.states, ["LA"]);
    assert.deepEqual(payload.cities, [{ state: "OG", city: "Abeokuta" }]);
  });

  it("hydrates edit selections from states and cities arrays first", () => {
    const zone = {
      state: "AB",
      city: "Umuahia",
      states: ["LA", "OG"],
      cities: [{ state: "LA", city: "Ikeja" }],
      locations: [{ scope: "state", state: "FC" }],
    };

    assert.deepEqual(selectedStateValues(zone), ["LA", "OG"]);
    assert.deepEqual(selectedCities(zone), [{ state: "LA", city: "Ikeja" }]);
  });

  it("hydrates edit selections from locations when arrays are missing", () => {
    const zone = {
      locations: [
        { scope: "state", state: "OG" },
        { scope: "city", state: "LA", city: "Surulere" },
      ],
    };

    assert.deepEqual(selectedStateValues(zone), ["OG"]);
    assert.deepEqual(selectedCities(zone), [{ state: "LA", city: "Surulere" }]);
  });

  it("falls back to legacy singular state and city fields only when new fields are absent", () => {
    const zone = { state: "LA", city: "Ikeja" };

    assert.deepEqual(selectedStateValues(zone), ["LA"]);
    assert.deepEqual(selectedCities(zone), [{ state: "LA", city: "Ikeja" }]);
  });

  it("summarizes country-wide, state, city, and mixed coverage", () => {
    const locations = {
      states: [
        { label: "Lagos", value: "LA" },
        { label: "Ogun", value: "OG" },
      ],
      cities: [],
    };

    assert.equal(coverageSummary({ countryLabel: "Nigeria", states: [], cities: [], locations }), "All locations in Nigeria");
    assert.equal(coverageSummary({ states: ["LA", "OG"], cities: [], locations }), "Lagos, Ogun");
    assert.equal(coverageSummary({ states: [], cities: [{ state: "LA", city: "Ikeja" }], locations }), "1 city in Lagos");
    assert.equal(coverageSummary({ states: ["OG"], cities: [{ state: "LA", city: "Ikeja" }], locations }), "1 state and 1 specific city");
  });

  it("formats compact list coverage summaries", () => {
    assert.equal(listCoverageSummary({ states: [], cities: [] }), "Entire country");
    assert.equal(listCoverageSummary({ states: ["LA", "OG"], cities: [] }), "LA, OG");
    assert.equal(listCoverageSummary({ cities: [{ state: "LA", city: "Ikeja" }, { state: "LA", city: "Surulere" }] }), "Ikeja + 1 city");
    assert.equal(listCoverageSummary({ states: ["OG"], cities: [{ state: "LA", city: "Ikeja" }] }), "1 state, 1 city");
  });
});

