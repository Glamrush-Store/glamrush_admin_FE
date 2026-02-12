/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{vue,js}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF2FF",
        },
        surface: {
          0: "#FFFFFF",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
        },
        sidebar: {
          bg: "#0F172A",
          text: "#CBD5E1",
          active: "#1E293B",
          border: "#4F46E5",
        },
      },
    },
  },
};
