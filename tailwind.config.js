/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  prefix: "tw-",
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        scada: "0 28px 80px rgba(0, 0, 0, 0.46), 0 0 0 1px rgba(0, 229, 255, 0.14)",
        "scada-light": "0 24px 64px rgba(30, 64, 175, 0.18), 0 0 0 1px rgba(14, 116, 144, 0.12)"
      }
    }
  },
  plugins: []
};
