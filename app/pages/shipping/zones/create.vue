<script setup>
import ShippingZoneForm from "~/components/shipping/ShippingZoneForm.vue";

function onCreated(zone) {
  navigateTo(`/shipping/zones/${zone.id}/edit`);
}
</script>

<template>
  <div>
    <Toast />

    <div class="mb-6 flex items-center gap-3">
      <NuxtLink to="/shipping/zones">
        <Button icon="pi pi-arrow-left" severity="secondary" text rounded />
      </NuxtLink>
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-900">Create Shipping Zone</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500">
          Assign a country, multiple state-wide areas, or specific cities to a zone.
        </p>
      </div>
    </div>

    <ShippingZoneForm
      mode="create"
      submit-label="Create Zone"
      @submit-success="onCreated"
    />
  </div>
</template>

