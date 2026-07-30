import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#07020d",
        panel: "#12091f",
        panelSoft: "#1a102b",
        systemBlue: "#e95bff",
        systemCyan: "#f8e7ff",
        systemViolet: "#9c4dff",
        systemMagenta: "#ff47d6",
        systemGreen: "#3df59f",
        warning: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        system:
          "0 0 28px rgba(233, 91, 255, 0.28), 0 0 48px rgba(156, 77, 255, 0.18)",
        panel:
          "inset 0 0 40px rgba(233, 91, 255, 0.08), 0 0 34px rgba(156, 77, 255, 0.2)"
      }
    }
  },
  plugins: []
} satisfies Config;
