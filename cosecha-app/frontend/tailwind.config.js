/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '380px',
      },
      colors: {
        tierra: {
          50: '#faf6f1',
          100: '#f0e6d6',
          200: '#e0ccad',
          300: '#cdab7d',
          400: '#be8f57',
          500: '#b07a42',
          600: '#9a6337',
          700: '#7d4d2f',
          800: '#68402c',
          900: '#583627',
        },
        campo: {
          50: '#f0f9f0',
          100: '#dbf0db',
          200: '#b9e1ba',
          300: '#8bcc8d',
          400: '#5db161',
          500: '#3d9641',
          600: '#2d7932',
          700: '#265f2a',
          800: '#224c26',
          900: '#1d3f22',
        },
        cosecha: {
          50: '#fefbe8',
          100: '#fef5c3',
          200: '#fee98a',
          300: '#fdd447',
          400: '#fbc116',
          500: '#eba809',
          600: '#cb8105',
          700: '#a25b08',
          800: '#86480f',
          900: '#723b13',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
