/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        ui: ["var(--font-ui)"]
      },
      boxShadow: {
        float: "0 20px 45px -18px rgba(0,0,0,0.85)"
      }
    }
  },
  plugins: []
};
