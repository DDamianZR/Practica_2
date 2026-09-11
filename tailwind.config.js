/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui"],
      },
      colors: {
        bg: "#07090c",
        panel: "#0d1117",
        panel2: "#141b25",
        line: "#1e2733",
        muted: "#5b6472",
        text: "#e6edf3",
        hi: "#22d3ee",
        hi2: "#34d399",
        lo: "#334155",
        warn: "#f59e0b",
        danger: "#ef4444",
        data: "#eab308",
      },
      boxShadow: {
        glow: "0 0 20px rgba(52, 211, 153, .55), 0 0 6px rgba(52, 211, 153, .8)",
        glowCyan: "0 0 20px rgba(34, 211, 238, .55), 0 0 6px rgba(34, 211, 238, .8)",
        glowWarn: "0 0 20px rgba(245, 158, 11, .55), 0 0 6px rgba(245, 158, 11, .8)",
        glowDanger: "0 0 20px rgba(239, 68, 68, .55), 0 0 6px rgba(239, 68, 68, .8)",
      },
      transitionTimingFunction: {
        outCirc: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
