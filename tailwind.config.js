/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6e5d46',
          light: '#d4c8a9',
        },
        neutral: {
          dark: '#0d0d0d',
          light: '#f0f0f0',
        },
      },
    },
  },
  plugins: [],
};
