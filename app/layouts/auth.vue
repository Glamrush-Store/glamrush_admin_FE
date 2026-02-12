<script setup>
import "~/assets/css/auth.css";
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-surface-50">
    <div
      class="w-full max-w-[420px] mx-4 p-8 bg-white border border-surface-200 rounded-xl shadow-sm"
    >
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white text-xl mb-3"
        >
          <i class="pi pi-sparkles" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Glamrush</h1>
        <p class="text-sm text-slate-500 mt-1">Admin Panel</p>
      </div>
      <slot />
    </div>
  </div>
</template>
