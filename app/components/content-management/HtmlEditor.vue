<script setup>
const model = defineModel({ type: String, default: "" });

const editor = ref(null);
const isSourceMode = ref(false);

const inlineActions = [
  { label: "B", title: "Bold", command: "bold" },
  { label: "I", title: "Italic", command: "italic" },
  { label: "U", title: "Underline", command: "underline" },
  { label: "S", title: "Strikethrough", command: "strikeThrough" },
];

const blockActions = [
  { label: "P", title: "Paragraph", value: "p" },
  { label: "H2", title: "Heading 2", value: "h2" },
  { label: "H3", title: "Heading 3", value: "h3" },
  { label: "H4", title: "Heading 4", value: "h4" },
  { label: "Quote", title: "Block quote", value: "blockquote" },
];

const listActions = [
  { label: "UL", title: "Unordered list", command: "insertUnorderedList" },
  { label: "OL", title: "Ordered list", command: "insertOrderedList" },
];

const isEmpty = computed(() => !model.value?.replace(/<[^>]*>/g, "").trim());

function syncToEditor() {
  const html = model.value || "";
  if (editor.value && editor.value.innerHTML !== html) {
    editor.value.innerHTML = html;
  }
}

onMounted(() => {
  syncToEditor();
});

watch(
  model,
  () => {
    if (isSourceMode.value) return;
    syncToEditor();
  },
  { immediate: true, flush: "post" },
);

watch(isSourceMode, (enabled) => {
  if (!enabled) {
    nextTick(syncToEditor);
  }
});

function focusEditor() {
  editor.value?.focus();
}

function syncFromEditor() {
  model.value = editor.value?.innerHTML || "";
}

function runCommand(command, value = null) {
  focusEditor();
  document.execCommand(command, false, value);
  syncFromEditor();
}

function formatBlock(tag) {
  runCommand("formatBlock", tag);
}

function insertLink() {
  const url = window.prompt("Enter link URL");
  if (!url) return;

  focusEditor();
  document.execCommand("createLink", false, url);
  const selection = window.getSelection();
  const anchor = selection?.anchorNode?.parentElement?.closest("a");
  if (anchor) {
    anchor.setAttribute("rel", "nofollow");
  }
  syncFromEditor();
}
</script>

<template>
  <div class="html-editor rounded-md border border-slate-200 bg-white">
    <div class="html-editor__toolbar flex flex-wrap items-center gap-1 border-b border-slate-200 p-2">
      <Button
        v-for="action in inlineActions"
        :key="action.command"
        type="button"
        :label="action.label"
        severity="secondary"
        size="small"
        text
        :title="action.title"
        @mousedown.prevent
        @click="runCommand(action.command)"
      />
      <span class="mx-1 h-5 w-px bg-slate-200" />
      <Button
        v-for="action in blockActions"
        :key="action.value"
        type="button"
        :label="action.label"
        severity="secondary"
        size="small"
        text
        :title="action.title"
        @mousedown.prevent
        @click="formatBlock(action.value)"
      />
      <span class="mx-1 h-5 w-px bg-slate-200" />
      <Button
        v-for="action in listActions"
        :key="action.command"
        type="button"
        :label="action.label"
        severity="secondary"
        size="small"
        text
        :title="action.title"
        @mousedown.prevent
        @click="runCommand(action.command)"
      />
      <Button
        type="button"
        label="Link"
        severity="secondary"
        size="small"
        text
        title="Insert link"
        @mousedown.prevent
        @click="insertLink"
      />
      <Button
        type="button"
        :label="isSourceMode ? 'Visual' : 'HTML'"
        severity="secondary"
        size="small"
        text
        class="ml-auto"
        :title="isSourceMode ? 'Use visual editor' : 'Edit HTML source'"
        @click="isSourceMode = !isSourceMode"
      />
    </div>

    <div v-if="!isSourceMode" class="html-editor__canvas-wrap">
      <div
        ref="editor"
        class="html-editor__canvas"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        @input="syncFromEditor"
        @blur="syncFromEditor"
      />
      <span v-if="isEmpty" class="html-editor__placeholder">
        Write formatted content here...
      </span>
    </div>

    <Textarea
      v-else
      v-model="model"
      rows="12"
      class="html-editor__source w-full border-none"
      placeholder="<p>Write formatted content here...</p>"
    />
  </div>
</template>

<style scoped>
.html-editor__canvas-wrap {
  position: relative;
}

.html-editor__canvas {
  min-height: 18rem;
  padding: 1rem;
  color: #0f172a;
  line-height: 1.65;
  outline: none;
}

.html-editor__placeholder {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.html-editor__canvas :deep(h2),
.html-editor__canvas :deep(h3),
.html-editor__canvas :deep(h4),
.html-editor__canvas :deep(p),
.html-editor__canvas :deep(blockquote),
.html-editor__canvas :deep(ul),
.html-editor__canvas :deep(ol) {
  margin: 0 0 0.75rem;
}

.html-editor__canvas :deep(h2) {
  font-size: 1.35rem;
  font-weight: 700;
}

.html-editor__canvas :deep(h3) {
  font-size: 1.15rem;
  font-weight: 700;
}

.html-editor__canvas :deep(h4) {
  font-size: 1rem;
  font-weight: 700;
}

.html-editor__canvas :deep(blockquote) {
  border-left: 3px solid #cbd5e1;
  color: #475569;
  padding-left: 0.875rem;
}

.html-editor__canvas :deep(ul),
.html-editor__canvas :deep(ol) {
  padding-left: 1.5rem;
}

.html-editor__source :deep(textarea) {
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
