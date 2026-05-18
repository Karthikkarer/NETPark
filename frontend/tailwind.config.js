/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          gold: '#FFB703',
          purple: '#3A0CA3',
          blue: '#0A1128',
          bg: '#050510'
        }
      }
    },
  },
  plugins: [],
}
