<script setup>
const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  selectedSet: {
    type: Object,
    required: true,
  },
  expandedSet: {
    type: Object,
    required: true,
  },
  searching: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toggle-selection", "toggle-expand"]);

const categoryId = computed(() => String(props.node.key ?? props.node.id));
const categoryLabel = computed(
  () => props.node.label || props.node.name || props.node.data?.name || "Untitled category",
);
const children = computed(() => props.node.children || []);
const hasChildren = computed(() => children.value.length > 0);
const isSelected = computed(() => props.selectedSet.has(categoryId.value));
const isExpanded = computed(
  () => props.searching || props.expandedSet.has(categoryId.value),
);
const indentStyle = computed(() => ({
  paddingLeft: `${props.depth * 18 + 8}px`,
}));

function onToggleExpand() {
  if (!hasChildren.value) return;
  emit("toggle-expand", categoryId.value);
}

function onToggleSelection() {
  emit("toggle-selection", categoryId.value);
}
</script>

<template>
  <div>
    <div
      class="category-tree-row"
      :class="{ 'category-tree-row-selected': isSelected }"
      :style="indentStyle"
      role="option"
      :aria-selected="isSelected"
    >
      <button
        v-if="hasChildren"
        type="button"
        class="category-tree-expand"
        :aria-label="isExpanded ? 'Collapse category' : 'Expand category'"
        @click.stop="onToggleExpand"
      >
        <span aria-hidden="true">{{ isExpanded ? "-" : "+" }}</span>
      </button>
      <span v-else class="category-tree-spacer" />

      <label class="category-tree-check">
        <input
          type="checkbox"
          class="category-tree-checkbox"
          :checked="isSelected"
          @change="onToggleSelection"
        />
        <span class="category-tree-label">{{ categoryLabel }}</span>
      </label>
    </div>

    <div v-show="isExpanded && hasChildren">
      <CategoryTreeOption
        v-for="child in children"
        :key="String(child.key ?? child.id)"
        :node="child"
        :depth="depth + 1"
        :selected-set="selectedSet"
        :expanded-set="expandedSet"
        :searching="searching"
        @toggle-selection="emit('toggle-selection', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.category-tree-row {
  align-items: center;
  border-radius: 6px;
  color: #f8fafc;
  display: flex;
  gap: 6px;
  min-height: 38px;
  padding-bottom: 5px;
  padding-right: 8px;
  padding-top: 5px;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.category-tree-row:hover {
  background: rgba(255, 255, 255, 0.08);
}

.category-tree-row-selected {
  background: rgba(34, 197, 94, 0.18);
}

.category-tree-expand,
.category-tree-spacer {
  align-items: center;
  border: 0;
  color: #e2e8f0;
  display: inline-flex;
  flex: 0 0 24px;
  height: 24px;
  justify-content: center;
  line-height: 1;
  width: 24px;
}

.category-tree-expand {
  background: rgba(148, 163, 184, 0.16);
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 800;
}

.category-tree-expand:hover {
  background: rgba(148, 163, 184, 0.28);
  color: #ffffff;
}

.category-tree-check {
  align-items: center;
  cursor: pointer;
  display: flex;
  flex: 1;
  gap: 8px;
  min-width: 0;
}

.category-tree-checkbox {
  accent-color: #16a34a;
  cursor: pointer;
  flex: 0 0 auto;
  height: 16px;
  width: 16px;
}

.category-tree-label {
  color: #f8fafc;
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
