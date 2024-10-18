import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        'starfield': 'url(\'/starfield.svg\')',
        'rocket': 'url(\'/rocket.svg\')',
      },
      fontFamily: {
        'monocraft-regular': 'Monocraft-Regular',
        'dmsans-regular': 'DMSans-Regular',
        'dmsans-bold': 'DMSans-Bold',
      },
    },
  },
  plugins: [],
};
export default config;
