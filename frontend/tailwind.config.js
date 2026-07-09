/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        leaf: "#0f766e",
        mint: "#d9f6ed",
        coral: "#ff6f61",
        sun: "#f4b942"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 33, 29, 0.12)"
      }
    }
  },
  plugins: []
};
