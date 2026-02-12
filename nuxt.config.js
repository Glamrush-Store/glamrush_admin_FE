// https://nuxt.com/docs/api/configuration/nuxt-config

import Aura from "@primevue/themes/Aura";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  devtools: { enabled: true },
  css: ["primeicons/primeicons.css"],
  modules: ["@pinia/nuxt", "@primevue/nuxt-module", "@nuxtjs/tailwindcss"],

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    public: {
      apiBase: "http://127.0.0.1:8000/api/v1",
    },
  },

  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Aura,
      },
    },
  },
});
