<script setup>
import { previewSrcDoc } from "~/utils/contentPreview";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  excerpt: {
    type: String,
    default: "",
  },
  html: {
    type: String,
    default: "",
  },
  settings: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible"]);

const srcdoc = computed(() => previewSrcDoc({
  title: props.title,
  excerpt: props.excerpt,
  html: props.html,
  settings: props.settings,
}));
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Administrative Preview"
    :style="{ width: '70rem', maxWidth: '96vw' }"
    :breakpoints="{ '800px': '96vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <Message severity="info" :closable="false" class="mb-4">
      This preview is isolated and does not mean the content is publicly visible.
    </Message>
    <iframe
      title="Administrative content preview"
      sandbox=""
      class="w-full h-[70vh] rounded-md border border-slate-200 bg-white"
      :srcdoc="srcdoc"
    />
  </Dialog>
</template>
