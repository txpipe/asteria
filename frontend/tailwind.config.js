/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,md,mdx}',
    './components/**/*.{js,ts,jsx,tsx,md,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'logo': 'url(\'/logo.svg\')',
        'starfield': 'url(\'/starfield.svg\')',
        'rocket': 'url(\'/rocket.svg\')',
      },
      fontFamily: {
        'monocraft-regular': 'Monocraft-Regular',
        'dmsans-regular': 'DMSans-Regular',
        'dmsans-bold': 'DMSans-Bold',
      }
    },
  },
  plugins: [],
}

