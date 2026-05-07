<script setup>
const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  height: {
    type: String,
    default: "320px",
  },
});

const currentIndex = ref(0);

const hasImages = computed(() => props.images.length > 0);
const currentImage = computed(() => props.images[currentIndex.value]);
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < props.images.length - 1);

function prev() {
  if (hasPrev.value) currentIndex.value--;
}

function next() {
  if (hasNext.value) currentIndex.value++;
}

function goTo(index) {
  currentIndex.value = index;
}

watch(
  () => props.images,
  () => {
    currentIndex.value = 0;
  },
);
</script>

<template>
  <div v-if="hasImages" class="relative">
    <!-- Main image -->
    <div
      class="relative overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center"
      :style="{ height }"
    >
      <img
        :src="currentImage.medium || currentImage.url"
        :alt="currentImage.name || 'Image'"
        class="max-h-full max-w-full object-contain"
      />

      <!-- Prev / Next arrows -->
      <template v-if="images.length > 1">
        <button
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors disabled:opacity-30 disabled:cursor-default"
          :disabled="!hasPrev"
          @click="prev"
        >
          <i class="pi pi-chevron-left text-sm text-slate-700" />
        </button>
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors disabled:opacity-30 disabled:cursor-default"
          :disabled="!hasNext"
          @click="next"
        >
          <i class="pi pi-chevron-right text-sm text-slate-700" />
        </button>
      </template>
    </div>

    <!-- Thumbnails -->
    <div
      v-if="images.length > 1"
      class="flex items-center gap-2 mt-3 overflow-x-auto pb-1"
    >
      <button
        v-for="(img, i) in images"
        :key="img.id || i"
        type="button"
        class="shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors"
        :class="
          i === currentIndex
            ? 'border-primary'
            : 'border-slate-200 hover:border-slate-400'
        "
        @click="goTo(i)"
      >
        <img
          :src="img.thumb || img.url"
          :alt="img.name || 'Thumbnail'"
          class="w-full h-full object-cover"
        />
      </button>
    </div>
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="flex flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-400"
    :style="{ height }"
  >
    <i class="pi pi-image text-4xl mb-2" />
    <span class="text-sm">No images available</span>
  </div>
</template>
