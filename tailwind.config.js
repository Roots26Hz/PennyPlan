/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        penny: {
          50: "#fef7ee",
          100: "#fdedd6",
          200: "#fad7ab",
          300: "#f6bb76",
          400: "#f1943e",
          500: "#ee7819",
          600: "#df5f0f",
          700: "#b9470f",
          800: "#933914",
          900: "#773114",
          950: "#401608",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
