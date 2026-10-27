/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        paper: '#f4f4f5',
        rule: '#1f2937',
      },
    },
  },
  corePlugins: {
    animation: false,
  },
};
