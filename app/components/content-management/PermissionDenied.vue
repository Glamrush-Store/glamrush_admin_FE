<script setup>
defineProps({
  message: {
    type: String,
    default: "You do not have permission to view this content.",
  },
});
</script>

<template>
  <Message severity="warn" :closable="false">
    <div class="flex items-start gap-3">
      <i class="pi pi-lock mt-1" />
      <div>
        <p class="m-0 font-semibold">Permission required</p>
        <p class="mb-0 mt-1 text-sm">{{ message }}</p>
      </div>
    </div>
  </Message>
</template>
