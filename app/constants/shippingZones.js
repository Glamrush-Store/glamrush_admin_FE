export const SHIPPING_ZONE_FIELD_LABELS = {
  country: "Country",
  states: "States",
  cities: "Cities",
};

export function locationCode(option) {
  return option?.value || option?.code || "";
}

export function cityKey(city) {
  if (!city) return "";
  const state = city.state ?? city.state_value ?? "";
  const value = city.city ?? city.value ?? "";
  return `${state}::${value}`;
}

export function cityOptionKey(option) {
  return cityKey({ state: option?.state_value, city: option?.value });
}

export function selectedStateValues(zone) {
  if (Array.isArray(zone?.states)) return zone.states.filter(Boolean);

  const statesFromLocations = Array.isArray(zone?.locations)
    ? zone.locations
      .filter((location) => location.scope === "state" && location.state)
      .map((location) => location.state)
    : [];

  if (statesFromLocations.length) return [...new Set(statesFromLocations)];
  return zone?.state ? [zone.state] : [];
}

export function selectedCities(zone) {
  if (Array.isArray(zone?.cities)) {
    return zone.cities
      .map((city) => ({ state: city.state ?? city.state_value, city: city.city ?? city.value }))
      .filter((city) => city.state && city.city);
  }

  const citiesFromLocations = Array.isArray(zone?.locations)
    ? zone.locations
      .filter((location) => location.scope === "city" && location.state && location.city)
      .map((location) => ({ state: location.state, city: location.city }))
    : [];

  if (citiesFromLocations.length) return citiesFromLocations;
  return zone?.state && zone?.city ? [{ state: zone.state, city: zone.city }] : [];
}

export function uniqueCities(cities = []) {
  const seen = new Set();
  return cities.filter((city) => {
    const key = cityKey(city);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildCityGroups(cities = [], stateFilter = null) {
  const groups = new Map();

  cities
    .filter((city) => !stateFilter || city.state_value === stateFilter)
    .forEach((city) => {
      const groupLabel = city.state_label || city.state_value || "Other";
      if (!groups.has(groupLabel)) {
        groups.set(groupLabel, { label: groupLabel, items: [] });
      }

      groups.get(groupLabel).items.push({
        ...city,
        key: cityOptionKey(city),
        label: `${city.label}, ${groupLabel}`,
      });
    });

  return [...groups.values()].map((group) => ({
    ...group,
    items: group.items.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

export function cityLabel(city, locations = null) {
  const cityValue = city?.city ?? city?.value;
  const stateValue = city?.state ?? city?.state_value;
  const match = locations?.cities?.find((option) => option.value === cityValue && option.state_value === stateValue);
  return match ? `${match.label}, ${match.state_label}` : [cityValue, stateValue].filter(Boolean).join(", ");
}

export function stateLabel(value, locations = null) {
  return locations?.states?.find((option) => option.value === value)?.label || value;
}

export function buildZonePayload(values, selectedStates, selectedCitiesValue, isActive, postalCodePattern) {
  const states = [...new Set((selectedStates || []).filter(Boolean))];
  const cities = uniqueCities(selectedCitiesValue).filter((city) => !states.includes(city.state));

  return {
    name: values.name,
    country: values.country,
    states,
    cities,
    postal_code_pattern: postalCodePattern || null,
    is_active: Boolean(isActive),
  };
}

export function coverageSummary({ countryLabel, states = [], cities = [], locations = null } = {}) {
  const nonRedundantCities = uniqueCities(cities).filter((city) => !states.includes(city.state));

  if (!states.length && !nonRedundantCities.length) {
    return countryLabel ? `All locations in ${countryLabel}` : "Entire country";
  }

  if (states.length && !nonRedundantCities.length) {
    if (states.length <= 2) return states.map((state) => stateLabel(state, locations)).join(", ");
    return `${states.length} states`;
  }

  if (!states.length && nonRedundantCities.length) {
    const cityStates = new Set(nonRedundantCities.map((city) => city.state));
    if (cityStates.size === 1) {
      return `${nonRedundantCities.length} ${nonRedundantCities.length === 1 ? "city" : "cities"} in ${stateLabel([...cityStates][0], locations)}`;
    }
    return `${nonRedundantCities.length} specific ${nonRedundantCities.length === 1 ? "city" : "cities"}`;
  }

  return `${states.length} ${states.length === 1 ? "state" : "states"} and ${nonRedundantCities.length} specific ${nonRedundantCities.length === 1 ? "city" : "cities"}`;
}

export function listCoverageSummary(zone) {
  const states = selectedStateValues(zone);
  const cities = uniqueCities(selectedCities(zone)).filter((city) => !states.includes(city.state));

  if (!states.length && !cities.length) return "Entire country";

  if (states.length && !cities.length) {
    if (states.length <= 2) {
      return states
        .map((state) => {
          const location = zone?.locations?.find((item) => item.scope === "state" && item.state === state);
          return location?.state_label || location?.state_name || state;
        })
        .join(", ");
    }
    return `${states.length} states`;
  }

  if (!states.length && cities.length) {
    if (cities.length === 1) return cities[0].city;
    return `${cities[0].city} + ${cities.length - 1} ${cities.length - 1 === 1 ? "city" : "cities"}`;
  }

  return `${states.length} ${states.length === 1 ? "state" : "states"}, ${cities.length} ${cities.length === 1 ? "city" : "cities"}`;
}

