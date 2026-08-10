<script setup>
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const sidebarCollapsed = shallowRef(false);
const catalogueOpen = ref(false);
const shippingOpen = ref(false);
const settingsOpen = ref(route.path.startsWith("/settings"));
const contentOpen = ref(route.path.startsWith("/content"));
const accessOpen = ref(route.path.startsWith("/users") || route.path.startsWith("/roles"));
const { can } = usePermissions();

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

function toggleContent() {
  contentOpen.value = !contentOpen.value;
}

function toggleAccess() {
  accessOpen.value = !accessOpen.value;
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

        <NuxtLink
          to="/newsletter-subscribers"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
        >
          <span>Newsletter</span>
          <i class="pi pi-envelope" />
        </NuxtLink>

        <NuxtLink
          to="/orders"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
        >
          <span>Orders</span>
          <i class="pi pi-shopping-bag" />
        </NuxtLink>

        <NuxtLink
          to="/storefront-campaigns"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
        >
          <span>Campaigns</span>
          <i class="pi pi-megaphone" />
        </NuxtLink>

        <NuxtLink
          to="/discount-codes"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
        >
          <span>Discount Codes</span>
          <i class="pi pi-ticket" />
        </NuxtLink>

        <!-- Access Control group -->
        <button
          v-if="can('ViewAny_User') || can('ViewAny_Role')"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text w-full border-none cursor-pointer transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
          @click="toggleAccess"
        >
          <span>Access Control</span>
          <i class="pi" :class="accessOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
        </button>
        <div v-show="accessOpen" class="flex flex-col gap-1 pl-4">
          <NuxtLink
            v-if="can('ViewAny_User')"
            to="/users"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Users</span>
            <i class="pi pi-users" />
          </NuxtLink>
          <NuxtLink
            v-if="can('ViewAny_Role')"
            to="/roles"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Roles & Permissions</span>
            <i class="pi pi-shield" />
          </NuxtLink>
        </div>

        <!-- Content group -->
        <button
          v-if="can('View_ContentPage') || can('View_Faq') || can('View_FaqCategory')"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text w-full border-none cursor-pointer transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap"
          @click="toggleContent"
        >
          <span>Content</span>
          <i class="pi" :class="contentOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
        </button>
        <div v-show="contentOpen" class="flex flex-col gap-1 pl-4">
          <NuxtLink
            v-if="can('View_ContentPage')"
            to="/content/pages"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Pages</span>
            <i class="pi pi-file-edit" />
          </NuxtLink>
          <NuxtLink
            v-if="can('View_Faq')"
            to="/content/faqs"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>FAQs</span>
            <i class="pi pi-question-circle" />
          </NuxtLink>
          <NuxtLink
            v-if="can('View_FaqCategory')"
            to="/content/faq-categories"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>FAQ Categories</span>
            <i class="pi pi-list" />
          </NuxtLink>
        </div>

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
          <NuxtLink
            v-if="can('View_Category') && can('Update_Category')"
            to="/settings/storefront-announcement"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm"
          >
            <span>Header Announcement</span>
            <i class="pi pi-megaphone" />
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
