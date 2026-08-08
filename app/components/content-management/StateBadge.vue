<script setup>
import { PUBLICATION_STATE_SEVERITY } from "~/constants/contentManagement";

defineProps({
  state: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <Tag
    :value="state || '-'"
    :severity="PUBLICATION_STATE_SEVERITY[state] || 'secondary'"
    class="capitalize"
  />
</template>
