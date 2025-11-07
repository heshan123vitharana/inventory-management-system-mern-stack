/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        pacifico: ['Pacifico', 'cursive'],
      },
      colors: {
        'primary': '#4A90E2',
        'secondary': '#F5A623',
        'accent': '#50E3C2',
        'background': '#F8F9FA',
        'surface': '#FFFFFF',
        'text-primary': '#2D3748',
        'text-secondary': '#718096',
        'border-color': '#E2E8F0',
      },
    },
  },
  plugins: [],
};
