/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1a1625', // Deep plum/brown background
          card: '#2f2b3a', // Lighter card background
          accent: '#ff8c69', // Peach/Coral accent
          secondary: '#766c8c', // Muted purple/grey
          text: '#ffffff',
          muted: '#9ca3af'
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2D2438 0%, #1a1625 100%)',
        'accent-gradient': 'linear-gradient(90deg, #ff8c69 0%, #ff6b6b 100%)',
      }
    },
  },
  plugins: [],
}
