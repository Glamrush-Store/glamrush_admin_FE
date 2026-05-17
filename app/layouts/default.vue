<script setup>
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const sidebarCollapsed = shallowRef(false);
const catalogueOpen = ref(false);
const shippingOpen = ref(false);
const settingsOpen = ref(false);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function toggleCatalogue() {
  catalogueOpen.value = !catalogueOpen.value;
}

function toggleShipping() {
  shippingOpen.value = !shippingOpen.value;
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value;
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      class="flex flex-col bg-sidebar-bg border-r border-slate-700 transition-all duration-200 overflow-hidden"
      :class="sidebarCollapsed ? 'w-0' : 'w-60'"
    >
      <div class="flex items-center p-4 border-b border-slate-700">
        <h2 class="text-lg font-bold text-white m-0 whitespace-nowrap">
          Glamrush
        </h2>
      </div>
      <nav class="flex flex-col p-2 gap-1">
        <NuxtLink
          to="/dashboard"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
        >
          <span>Dashboard</span>
          <i class="pi pi-home" />
        </NuxtLink>

        <NuxtLink
          to="/customers"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
        >
          <span>Customers</span>
          <i class="pi pi-users" />
        </NuxtLink>

        <!-- Shipping group -->
        <button
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text w-full border-none cursor-pointer transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
          @click="toggleShipping"
        >
          <span>Shipping</span>
          <i class="pi" :class="shippingOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
        </button>
        <div v-show="shippingOpen" class="flex flex-col gap-1 pl-4">
          <NuxtLink
            to="/shipping/zones"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Zones</span>
            <i class="pi pi-map-marker" />
          </NuxtLink>
          <NuxtLink
            to="/shipping/methods"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Methods</span>
            <i class="pi pi-truck" />
          </NuxtLink>
          <NuxtLink
            to="/shipping/rates"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Rates</span>
            <i class="pi pi-receipt" />
          </NuxtLink>
          <NuxtLink
            to="/shipments"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Shipments</span>
            <i class="pi pi-send" />
          </NuxtLink>
        </div>

        <!-- Catalogue group -->
        <button
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text w-full border-none cursor-pointer transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
          @click="toggleCatalogue"
        >
          <span>Catalogue</span>
          <i class="pi" :class="catalogueOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
        </button>
        <div v-show="catalogueOpen" class="flex flex-col gap-1 pl-4">
          <NuxtLink
            to="/products"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Products</span>
            <i class="pi pi-box" />
          </NuxtLink>
          <NuxtLink
            to="/categories"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Categories</span>
            <i class="pi pi-tags" />
          </NuxtLink>
          <NuxtLink
            to="/brands"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Brands</span>
            <i class="pi pi-star" />
          </NuxtLink>
          <NuxtLink
            to="/vendors"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Vendors</span>
            <i class="pi pi-truck" />
          </NuxtLink>
          <NuxtLink
            to="/collections"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Collections</span>
            <i class="pi pi-objects-column" />
          </NuxtLink>
        </div>

        <!-- Settings group -->
        <button
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text w-full border-none cursor-pointer transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
          @click="toggleSettings"
        >
          <span>Settings</span>
          <i class="pi" :class="settingsOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
        </button>
        <div v-show="settingsOpen" class="flex flex-col gap-1 pl-4">
          <NuxtLink
            to="/settings/attribute-codes"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Manage Attribute Codes</span>
            <i class="pi pi-list" />
          </NuxtLink>
          <NuxtLink
            to="/settings/payment-methods"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Payments</span>
            <i class="pi pi-credit-card" />
          </NuxtLink>
        </div>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col bg-surface-50">
      <header class="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-200">
        <button
          class="flex flex-col justify-center items-center gap-1 w-8 h-8 rounded-md hover:bg-surface-100 transition-colors cursor-pointer bg-transparent border-none p-1"
          @click="toggleSidebar"
        >
          <span class="block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200" :class="sidebarCollapsed ? '' : 'translate-y-[3px] rotate-45'" />
          <span class="block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200" :class="sidebarCollapsed ? '' : 'opacity-0'" />
          <span class="block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200" :class="sidebarCollapsed ? '' : '-translate-y-[3px] -rotate-45'" />
        </button>
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
