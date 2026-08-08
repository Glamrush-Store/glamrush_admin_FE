<script setup>
import { useVendorStore } from "~/stores/vendor";

const route = useRoute();
const vendorStore = useVendorStore();

const id = route.params.id;

function formatDate(value) {
  if (!value) return "\u2014";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const vendor = computed(() => vendorStore.vendor);

onMounted(() => {
  vendorStore.fetchVendor(id);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/vendors">
          <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ vendor?.business_name || "Vendor Detail" }}
        </h1>
      </div>
      <div v-if="vendor" class="flex items-center gap-2">
        <NuxtLink :to="`/vendors/${id}/edit`">
          <Button label="Edit" icon="pi pi-pencil" />
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="vendorStore.vendorLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Vendor Details -->
    <div v-else-if="vendor">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Image -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg border border-slate-200 p-4">
            <h2 class="text-lg font-semibold text-slate-800 mb-3">
              Vendor Image
            </h2>
            <div v-if="vendor.image">
              <img
                :src="vendor.image.medium || vendor.image.url"
                :alt="vendor.business_name"
                class="w-full rounded"
              />
            </div>
            <div
              v-else
              class="flex items-center justify-center h-48 bg-slate-100 rounded text-slate-400"
            >
              <i class="pi pi-image text-4xl" />
            </div>
          </div>
        </div>

        <!-- Right: Cards -->
        <div class="lg:col-span-2 grid grid-cols-1 gap-6">
          <!-- General Info Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              General Information
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Contact Name</span>
                <p class="font-medium text-slate-900">{{ vendor.name }}</p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Business Name</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.business_name }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Email</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.email || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Phone</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.phone || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Code</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.code || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Sort Order</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.sort_order ?? "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Status</span>
                <p>
                  <Tag
                    :value="vendor.is_active ? 'Active' : 'Inactive'"
                    :severity="vendor.is_active ? 'success' : 'danger'"
                  />
                </p>
              </div>
            </div>
          </div>

          <!-- Address Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">Address</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Address Line 1</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.address_line_1 || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Address Line 2</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.address_line_2 || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">City</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.city || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">State</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.state || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Postal Code</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.postal_code || "\u2014" }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Country</span>
                <p class="font-medium text-slate-900">
                  {{ vendor.country || "\u2014" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Timestamps Card -->
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              Timestamps
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span class="text-sm text-slate-500">Created At</span>
                <p class="font-medium text-slate-900">
                  {{ formatDate(vendor.created_at) }}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500">Updated At</span>
                <p class="font-medium text-slate-900">
                  {{ formatDate(vendor.updated_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
