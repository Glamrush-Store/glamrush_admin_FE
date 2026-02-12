<script setup>
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const sidebarCollapsed = shallowRef(false);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      class="flex flex-col bg-sidebar-bg border-r border-slate-700 transition-all duration-200"
      :class="sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <div class="flex items-center justify-between p-4 border-b border-slate-700">
        <h2
          v-show="!sidebarCollapsed"
          class="text-lg font-bold text-white m-0"
        >
          Glamrush
        </h2>
        <Button
          icon="pi pi-bars"
          text
          severity="secondary"
          class="!text-sidebar-text"
          @click="toggleSidebar"
        />
      </div>
      <nav class="flex flex-col p-2 gap-1">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white"
        >
          <i class="pi pi-home" />
          <span v-show="!sidebarCollapsed">Dashboard</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col bg-surface-50">
      <header class="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-200">
        <div class="flex-1" />
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-500">{{ authStore.user?.name }}</span>
          <Button
            icon="pi pi-sign-out"
            label="Logout"
            text
            severity="secondary"
            @click="authStore.logout()"
          />
        </div>
      </header>
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
