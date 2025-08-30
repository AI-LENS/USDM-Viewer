/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        usdm: {
          "primary": "#6ea8ff",
          "secondary": "#9ec1ff", 
          "accent": "#ffd166",
          "neutral": "#121734",
          "base-100": "#0b1020",
          "base-200": "#121734",
          "base-300": "#1b2350",
          "info": "#6ea8ff",
          "success": "#b4ffb7",
          "warning": "#ffd28b",
          "error": "#ffb3b3",
        },
      },
    ],
  },
}
