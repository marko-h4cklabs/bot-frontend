// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Scan the whole app directory
    "./components/**/*.{js,ts,jsx,tsx}",
    // Remove "./pages/**/*.{js,ts,jsx,tsx}" if you fully migrated from the old pages router
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}