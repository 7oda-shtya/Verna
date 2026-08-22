/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  plugins: [],
  // tailwind.config.js
  theme: {
    extend: {
      backgroundImage: {
        'client-app': 'linear-gradient(to bottom, #0f1f1a, #111827, #0a0a0a)',
        'driver-app': 'linear-gradient(to bottom, #0c1a2e, #111827, #0a0a0a)',
        'admin-app': 'linear-gradient(to bottom, #111827, #0a0a0a)',
      },
    },
  },
};
