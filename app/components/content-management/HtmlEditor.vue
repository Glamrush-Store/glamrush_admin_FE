<script setup>
const model = defineModel({ type: String, default: "" });

const textarea = ref(null);

const snippets = [
  { label: "B", title: "Bold", before: "<strong>", after: "</strong>" },
  { label: "I", title: "Italic", before: "<em>", after: "</em>" },
  { label: "U", title: "Underline", before: "<u>", after: "</u>" },
  { label: "S", title: "Strikethrough", before: "<s>", after: "</s>" },
  { label: "H2", title: "Heading 2", before: "<h2>", after: "</h2>" },
  { label: "H3", title: "Heading 3", before: "<h3>", after: "</h3>" },
  { label: "H4", title: "Heading 4", before: "<h4>", after: "</h4>" },
  { label: "Quote", title: "Block quote", before: "<blockquote>", after: "</blockquote>" },
  { label: "UL", title: "Unordered list", before: "<ul><li>", after: "</li></ul>" },
  { label: "OL", title: "Ordered list", before: "<ol><li>", after: "</li></ol>" },
  { label: "Link", title: "Safe link", before: '<a href="https://" rel="nofollow">', after: "</a>" },
  { label: "P", title: "Paragraph", before: "<p>", after: "</p>" },
];

function wrapSelection(snippet) {
  const element = textarea.value?.$el?.querySelector("textarea") || textarea.value;
  const start = element?.selectionStart ?? model.value.length;
  const end = element?.selectionEnd ?? model.value.length;
  const selected = model.value.slice(start, end) || "Text";
  model.value = `${model.value.slice(0, start)}${snippet.before}${selected}${snippet.after}${model.value.slice(end)}`;
  nextTick(() => element?.focus());
}
</script>

<template>
  <div class="rounded-md border border-slate-200 bg-white">
    <div class="flex flex-wrap gap-1 border-b border-slate-200 p-2">
      <Button
        v-for="snippet in snippets"
        :key="snippet.title"
        type="button"
        :label="snippet.label"
        severity="secondary"
        size="small"
        text
        :title="snippet.title"
        @click="wrapSelection(snippet)"
      />
    </div>
    <Textarea
      ref="textarea"
      v-model="model"
      rows="12"
      class="w-full border-none"
      placeholder="<p>Write formatted content here...</p>"
    />
  </div>
</template>
