/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#800020', // Burgundy / Maroon
          hover: '#6E001B',
          light: '#9E1B32',
          subtle: '#FDF2F4',
          50: '#FDF2F4',
          100: '#F9DCE1',
          200: '#F2B9C3',
          500: '#800020',
          600: '#6E001B',
          700: '#5C001A',
          800: '#4A0015',
          900: '#380010'
        },
        secondary: {
          DEFAULT: '#5C001A', // Dark Maroon
          hover: '#4A0015',
          dark: '#380010'
        },
        surface: {
          bg: '#F8F8F8', // Light Gray background
          card: '#FFFFFF',
          border: '#E5E7EB',
          hover: '#F3F4F6'
        },
        typography: {
          dark: '#1F2937', // Dark Gray
          muted: '#6B7280', // Light Gray text
          light: '#9CA3AF'
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
