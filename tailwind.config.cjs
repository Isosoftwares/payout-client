/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#C75D2C",
        secondary: "#C83F12",
        dark: "#343a40",
        light: "#ffffff",
        tertiary: "#cdc7ecea",
      },

      backgroundImage: {
        hero: "url('/src/assets/graphics/solid4.jpg')",
        // Additional gradient backgrounds for modern look
        "gradient-primary": "linear-gradient(135deg, #3264ff 0%, #2563eb 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, #a67eff 0%, #8b45ff 100%)",
        "gradient-subtle": "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
      },

      borderWidth: {
        3: "3px",
      },

      zIndex: {
        60: "60",
      },

      // Additional useful extensions for a lookup site
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },

      // Box shadows for depth
      boxShadow: {
        soft:
          "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        strong:
          "0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -5px rgba(0, 0, 0, 0.04)",
      },

      // Animation for interactions
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
});
