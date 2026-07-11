/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        leaf: "#0E8A7C",
        mint: "#E3F5F2",
        coral: "#F26419",
        sun: "#F59E0B",
        canvas: "#F3F7FA"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(17, 24, 39, 0.10)",
        panel: "0 1px 2px rgba(17, 24, 39, 0.05)"
      }
    }
  },
  plugins: []
};
