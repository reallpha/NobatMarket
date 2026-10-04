// ============================================================================
// پیکربندی Tailwind CSS - پالت رنگی پریموم و RTL
// ============================================================================

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2f2",
          100: "#fde6e6",
          200: "#fbd0d0",
          300: "#f7a8a8",
          400: "#f17575",
          500: "#e74444",
          600: "#d42626",
          700: "#b21c1c",
          800: "#941b1b",
          900: "#7c1d1d",
          950: "#430b0b",
          DEFAULT: "#e74444",
        },
        gold: {
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          DEFAULT: "#eab308",
        },
        // رنگ‌های داشبورد (ثابت - حالت تاریک)
        surface: {
          primary: "#09090b",
          secondary: "#18181b",
          tertiary: "#18181b",
          elevated: "#18181b",
          hover: "#3f3f46",
        },
        content: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
          tertiary: "#71717a",
          disabled: "#52525b",
        },
        border: {
          subtle: "#18181b",
          default: "#27272a",
          strong: "#3f3f46",
          focus: "#f43e5e",
        },
        status: {
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",
        },
      },

      fontFamily: {
        persian: [
          "var(--font-sahel)",
          "Sahel",
          "Tahoma",
          "Arial",
          "sans-serif",
        ],
        sahel: ["var(--font-sahel)", "Sahel", "Tahoma", "sans-serif"],
        vazirmatn: ["var(--font-vazirmatn)", "Vazirmatn", "Tahoma", "sans-serif"],
        lalezar: ["Lalezar", "var(--font-sahel)", "Tahoma", "sans-serif"],
        sans: [
          "var(--font-inter)",
          "Inter",
          "var(--font-sahel)",
          "Sahel",
          "Tahoma",
          "Arial",
          "sans-serif",
        ],
      },

      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(231, 68, 68, 0.3)",
        "glow-md": "0 0 25px -5px rgba(231, 68, 68, 0.4)",
        "glow-lg": "0 0 40px -10px rgba(231, 68, 68, 0.5)",
        "glow-gold": "0 0 25px -5px rgba(234, 179, 8, 0.4)",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-up": "fadeUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px -3px rgba(231, 68, 68, 0.3)" },
          "50%": { boxShadow: "0 0 25px -5px rgba(231, 68, 68, 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #e74444 0%, #d42626 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #1a1a1a 100%)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
    },
  },

  plugins: [require("tailwindcss-rtl")],
};

export default config;
