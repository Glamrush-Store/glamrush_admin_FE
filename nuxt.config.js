// https://nuxt.com/docs/api/configuration/nuxt-config

//import Aura from "@primevue/themes/Aura";

import Aura from "@primeuix/themes/aura";

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
      apiBase: process.env.API_BASE || "http://127.0.0.1:8001/api/v1",
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
