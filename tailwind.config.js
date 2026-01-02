/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00",
        "primary-dark": "#e65100",
        "background-light": "#f2f0f2",
        "background-dark": "#121212",
        "card-light": "#ffffff",
        "card-dark": "#1E1E1E",
        "text-main-light": "#1C1C1E",
        "text-main-dark": "#FFFFFF",
        "text-subtle": "#8E8E93",
        "border-light": "#F0F0F2",
        "border-dark": "#2C2C2E",
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
