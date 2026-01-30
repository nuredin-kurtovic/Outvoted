/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e6e9f0',
          100: '#b3bdd0',
          200: '#8091b0',
          300: '#4d6590',
          400: '#1a3970',
          500: '#001f54',
          600: '#001946',
          700: '#001338',
          800: '#000d2a',
          900: '#00071c',
        },
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
        '20': 'repeat(20, minmax(0, 1fr))',
        '30': 'repeat(30, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
}
