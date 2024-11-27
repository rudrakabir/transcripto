/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Add any custom colors here
      },
    },
  },
  // Add this important line to prevent conflicts with Chakra UI
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}