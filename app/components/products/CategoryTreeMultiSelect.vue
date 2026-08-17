<script setup>
import CategoryTreeOption from "./CategoryTreeOption.vue";

const model = defineModel({
  type: Array,
  default: () => [],
});

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Select categories",
  },
  inputId: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(false);
const search = ref("");
const expandedIds = ref(new Set());
const rootRef = ref(null);
const searchInputRef = ref(null);

const selectedSet = computed(() => new Set(model.value.map((id) => String(id))));

const categoryLookup = computed(() => {
  const lookup = {};

  function visit(nodes) {
    nodes.forEach((node) => {
      const id = getNodeId(node);
      if (!id) return;
      lookup[id] = node;
      visit(getNodeChildren(node));
    });
  }

  visit(props.options);
  return lookup;
});

const selectedCategories = computed(() =>
  model.value.map((id) => {
    const node = categoryLookup.value[String(id)];
    return {
      id: String(id),
      label: getNodeLabel(node) || `Category ${id}`,
    };
  }),
);

const filteredOptions = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.options;
  return filterCategoryTree(props.options, query);
});

const hasOptions = computed(() => props.options.length > 0);
const isSearching = computed(() => search.value.trim().length > 0);
const displayText = computed(() =>
  selectedCategories.value.length > 0
    ? `${selectedCategories.value.length} selected`
    : props.placeholder,
);

watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  searchInputRef.value?.focus();
});

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});

function getNodeId(node) {
  if (!node) return null;
  const id = node.key ?? node.id ?? node.value ?? node.data?.id;
  return id === null || id === undefined || id === "" ? null : String(id);
}

function getNodeLabel(node) {
  if (!node) return "";
  return node.label || node.name || node.title || node.data?.name || node.data?.title || "";
}

function getNodeChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

function filterCategoryTree(nodes, query) {
  return nodes.reduce((matches, node) => {
    const labelMatches = getNodeLabel(node).toLowerCase().includes(query);
    const children = getNodeChildren(node);
    const filteredChildren = filterCategoryTree(children, query);

    if (labelMatches) {
      matches.push({
        ...node,
        children,
      });
      return matches;
    }

    if (filteredChildren.length > 0) {
      matches.push({
        ...node,
        children: filteredChildren,
      });
    }

    return matches;
  }, []);
}

function onDocumentPointerDown(event) {
  if (!rootRef.value || rootRef.value.contains(event.target)) return;
  isOpen.value = false;
}

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function toggleSelection(categoryId) {
  const id = String(categoryId);
  if (selectedSet.value.has(id)) {
    model.value = model.value.filter((selectedId) => String(selectedId) !== id);
    return;
  }

  model.value = [...model.value, id];
}

function removeCategory(categoryId) {
  const id = String(categoryId);
  model.value = model.value.filter((selectedId) => String(selectedId) !== id);
}

function toggleExpand(categoryId) {
  const id = String(categoryId);
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
}

function clearSelection() {
  model.value = [];
}
</script>

<template>
  <div ref="rootRef" class="category-selector">
    <button
      :id="inputId"
      type="button"
      class="category-selector-control"
      :class="{ 'category-selector-control-open': isOpen }"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleDropdown"
    >
      <span
        v-if="selectedCategories.length === 0"
        class="category-selector-placeholder"
      >
        {{ placeholder }}
      </span>
      <span v-else class="category-selector-chips">
        <span
          v-for="category in selectedCategories"
          :key="category.id"
          class="category-selector-chip"
          @click.stop
        >
          <span>{{ category.label }}</span>
          <button
            type="button"
            class="category-selector-chip-remove"
            :aria-label="`Remove ${category.label}`"
            @click.stop="removeCategory(category.id)"
          >
            <span aria-hidden="true">x</span>
          </button>
        </span>
      </span>
      <span class="category-selector-summary">{{ displayText }}</span>
      <span class="category-selector-chevron" aria-hidden="true">
        {{ isOpen ? "^" : "v" }}
      </span>
    </button>

    <div v-if="isOpen" class="category-selector-panel">
      <span class="category-selector-search">
        <span class="category-selector-search-icon" aria-hidden="true" />
        <input
          ref="searchInputRef"
          v-model="search"
          type="search"
          placeholder="Search categories"
          @click.stop
        />
      </span>

      <div
        v-if="filteredOptions.length > 0"
        class="category-selector-tree"
        role="listbox"
        aria-multiselectable="true"
      >
        <CategoryTreeOption
          v-for="node in filteredOptions"
          :key="String(node.key ?? node.id)"
          :node="node"
          :selected-set="selectedSet"
          :expanded-set="expandedIds"
          :searching="isSearching"
          @toggle-selection="toggleSelection"
          @toggle-expand="toggleExpand"
        />
      </div>

      <div v-else class="category-selector-empty">
        {{ hasOptions ? "No categories match your search." : "No categories available." }}
      </div>

      <div v-if="selectedCategories.length > 0" class="category-selector-footer">
        <span>{{ selectedCategories.length }} selected</span>
        <button type="button" @click="clearSelection">Clear</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-selector {
  position: relative;
  width: 100%;
}

.category-selector-control {
  align-items: center;
  background: #020617;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  gap: 8px;
  min-height: 44px;
  padding: 6px 10px;
  text-align: left;
  width: 100%;
}

.category-selector-control:hover,
.category-selector-control-open {
  border-color: #64748b;
}

.category-selector-control:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.category-selector-placeholder,
.category-selector-summary {
  color: #e2e8f0;
  font-size: 0.875rem;
}

.category-selector-placeholder {
  flex: 1;
}

.category-selector-summary {
  display: none;
  margin-left: auto;
  white-space: nowrap;
}

.category-selector-chips {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
}

.category-selector-chip {
  align-items: center;
  background: #14532d;
  border: 1px solid #22c55e;
  border-radius: 999px;
  color: #ffffff;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 600;
  gap: 5px;
  max-width: 180px;
  padding: 3px 7px;
}

.category-selector-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-selector-chip-remove {
  align-items: center;
  background: transparent;
  border: 0;
  color: #dcfce7;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  padding: 0;
}

.category-selector-chevron {
  color: #cbd5e1;
  flex: 0 0 auto;
  font-size: 0.8rem;
  font-weight: 800;
}

.category-selector-panel {
  background: #020617;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.34);
  left: 0;
  margin-top: 6px;
  max-height: min(420px, 70vh);
  overflow: hidden;
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 60;
}

.category-selector-search {
  align-items: center;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
  display: flex;
  gap: 8px;
  padding: 10px;
}

.category-selector-search-icon {
  border: 2px solid #cbd5e1;
  border-radius: 999px;
  flex: 0 0 auto;
  height: 13px;
  position: relative;
  width: 13px;
}

.category-selector-search-icon::after {
  background: #cbd5e1;
  bottom: -5px;
  content: "";
  height: 7px;
  position: absolute;
  right: -4px;
  transform: rotate(-45deg);
  width: 2px;
}

.category-selector-search input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #ffffff;
  flex: 1;
  font-size: 0.875rem;
  min-width: 0;
  outline: none;
  padding: 8px 10px;
}

.category-selector-search input::placeholder {
  color: #cbd5e1;
}

.category-selector-search input:focus {
  border-color: #94a3b8;
}

.category-selector-tree {
  max-height: 305px;
  overflow: auto;
  padding: 6px;
}

.category-selector-empty {
  color: #e2e8f0;
  font-size: 0.875rem;
  padding: 18px 12px;
  text-align: center;
}

.category-selector-footer {
  align-items: center;
  border-top: 1px solid #1e293b;
  color: #e2e8f0;
  display: flex;
  font-size: 0.8rem;
  justify-content: space-between;
  padding: 9px 10px;
}

.category-selector-footer button {
  background: transparent;
  border: 0;
  color: #86efac;
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 640px) {
  .category-selector-summary {
    display: inline;
  }

  .category-selector-chip {
    max-width: 130px;
  }

  .category-selector-panel {
    max-height: 60vh;
  }
}
</style>
