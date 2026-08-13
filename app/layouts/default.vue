<script setup>
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const sidebarCollapsed = shallowRef(false);
const { can } = usePermissions();
const menuOpen = reactive({
  orders: route.path.startsWith("/orders") || route.path.startsWith("/payment-transactions"),
  catalog: route.path.startsWith("/products")
    || route.path.startsWith("/categories")
    || route.path.startsWith("/brands")
    || route.path.startsWith("/vendors")
    || route.path.startsWith("/collections")
    || route.path.startsWith("/discount-codes"),
  content: route.path.startsWith("/content")
    || route.path.startsWith("/storefront-campaigns")
    || route.path.startsWith("/newsletter-subscribers"),
  settings: route.path.startsWith("/settings")
    || route.path.startsWith("/shipping")
    || route.path.startsWith("/shipments")
    || route.path.startsWith("/users")
    || route.path.startsWith("/roles"),
});

const navItems = [
  { type: "link", label: "Dashboard", to: "/dashboard", icon: "pi pi-home", permission: "View_Dashboard" },
  { type: "link", label: "Customers", to: "/customers", icon: "pi pi-users", permission: "View_Customer" },
  {
    type: "group",
    key: "orders",
    label: "Orders",
    icon: "pi pi-shopping-bag",
    children: [
      { label: "Orders", to: "/orders", icon: "pi pi-shopping-bag", permission: "View_Order" },
      { label: "Transactions", to: "/payment-transactions", icon: "pi pi-credit-card", permission: "View_PaymentTransaction" },
    ],
  },
  {
    type: "group",
    key: "catalog",
    label: "Catalog",
    icon: "pi pi-box",
    children: [
      { label: "Products", to: "/products", icon: "pi pi-box", permission: "View_Product" },
      { label: "Categories", to: "/categories", icon: "pi pi-tags", permission: "View_Category" },
      { label: "Brands", to: "/brands", icon: "pi pi-star", permission: "View_Brand" },
      { label: "Vendors", to: "/vendors", icon: "pi pi-truck", permission: "View_Vendor" },
      { label: "Collections", to: "/collections", icon: "pi pi-objects-column", permission: "View_Category" },
      { label: "Discount Codes", to: "/discount-codes", icon: "pi pi-ticket", permission: "View_Discount" },
    ],
  },
  {
    type: "group",
    key: "content",
    label: "Content",
    icon: "pi pi-file-edit",
    children: [
      { label: "Pages", to: "/content/pages", icon: "pi pi-file-edit", permission: "View_ContentPage" },
      { label: "FAQs", to: "/content/faqs", icon: "pi pi-question-circle", permission: "View_Faq" },
      { label: "FAQ Categories", to: "/content/faq-categories", icon: "pi pi-list", permission: "View_FaqCategory" },
      { label: "Campaigns", to: "/storefront-campaigns", icon: "pi pi-megaphone", permission: "ViewAny_StorefrontCampaign" },
      { label: "Newsletter", to: "/newsletter-subscribers", icon: "pi pi-envelope", permission: "ViewAny_NewsletterSubscriber" },
    ],
  },
  {
    type: "group",
    key: "settings",
    label: "Settings",
    icon: "pi pi-cog",
    children: [
      { label: "Header Announcement", to: "/settings/storefront-announcement", icon: "pi pi-megaphone", permissionsAll: ["View_Category", "Update_Category"] },
      { label: "Attribute Codes", to: "/settings/attribute-codes", icon: "pi pi-list", permissionsAny: ["View_SkuAttributeCode", "View_Vendor"] },
      {
        label: "Shipping",
        icon: "pi pi-truck",
        children: [
          { label: "Zones", to: "/shipping/zones", icon: "pi pi-map-marker", permission: "View_Shipment" },
          { label: "Methods", to: "/shipping/methods", icon: "pi pi-truck", permission: "View_Shipment" },
          { label: "Rates", to: "/shipping/rates", icon: "pi pi-receipt", permission: "View_Shipment" },
          { label: "Shipments", to: "/shipments", icon: "pi pi-send", permission: "View_Shipment" },
        ],
      },
      {
        label: "Payments",
        icon: "pi pi-credit-card",
        children: [
          { label: "Payment Methods", to: "/settings/payment-methods", icon: "pi pi-credit-card", permission: "View_PaymentMethod" },
        ],
      },
      {
        label: "Access Control",
        icon: "pi pi-shield",
        children: [
          { label: "Users", to: "/users", icon: "pi pi-users", permission: "ViewAny_User" },
          { label: "Roles & Permissions", to: "/roles", icon: "pi pi-shield", permission: "ViewAny_Role" },
        ],
      },
      {
        label: "Admin",
        icon: "pi pi-sliders-h",
        children: [
          { label: "Site Settings", to: "/settings/site-settings", icon: "pi pi-sliders-h", permission: "View_Setting" },
        ],
      },
    ],
  },
];

const topLinkClass = "flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap";
const topButtonClass = `${topLinkClass} w-full border-none cursor-pointer`;
const childLinkClass = "flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text no-underline transition-colors hover:bg-sidebar-active hover:text-white whitespace-nowrap text-sm";
const childGroupClass = "px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400";

function hasAccess(item) {
  if (item.permission) return can(item.permission);
  if (item.permissionsAll) return item.permissionsAll.every((permission) => can(permission));
  if (item.permissionsAny) return item.permissionsAny.some((permission) => can(permission));
  return true;
}

function filterMenuItems(items) {
  return items
    .map((item) => {
      if (!item.children) return hasAccess(item) ? item : null;

      const children = filterMenuItems(item.children);
      if (!children.length || !hasAccess(item)) return null;

      return { ...item, children };
    })
    .filter(Boolean);
}

const visibleNavItems = computed(() => filterMenuItems(navItems));

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function toggleMenu(key) {
  menuOpen[key] = !menuOpen[key];
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
        <template v-for="item in visibleNavItems" :key="item.label">
          <NuxtLink
            v-if="item.type === 'link'"
            :to="item.to"
            :class="topLinkClass"
          >
            <span>{{ item.label }}</span>
            <i :class="item.icon" />
          </NuxtLink>

          <template v-else>
            <button
              :class="topButtonClass"
              @click="toggleMenu(item.key)"
            >
              <span>{{ item.label }}</span>
              <span class="flex items-center gap-2">
                <i :class="item.icon" />
                <i class="pi" :class="menuOpen[item.key] ? 'pi-chevron-down' : 'pi-chevron-right'" />
              </span>
            </button>

            <div v-show="menuOpen[item.key]" class="flex flex-col gap-1 pl-4">
              <template v-for="child in item.children" :key="child.label">
                <NuxtLink
                  v-if="!child.children"
                  :to="child.to"
                  :class="childLinkClass"
                >
                  <span>{{ child.label }}</span>
                  <i :class="child.icon" />
                </NuxtLink>

                <div v-else class="flex flex-col gap-1">
                  <div :class="childGroupClass">
                    <span>{{ child.label }}</span>
                  </div>
                  <NuxtLink
                    v-for="nestedChild in child.children"
                    :key="nestedChild.label"
                    :to="nestedChild.to"
                    :class="childLinkClass"
                  >
                    <span>{{ nestedChild.label }}</span>
                    <i :class="nestedChild.icon" />
                  </NuxtLink>
                </div>
              </template>
            </div>
          </template>
        </template>
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
