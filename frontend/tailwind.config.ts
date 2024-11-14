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
        'challenge': 'url(\'/challenge.png\')',
      },
      fontFamily: {
        'inter-regular': 'Inter-Regular',
        'monocraft-regular': 'Monocraft-Regular',
        'dmsans-regular': 'DMSans-Regular',
        'dmsans-bold': 'DMSans-Bold',
        'dmsans-semibold': 'DMSans-SemiBold',
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: 'class',
    }),
  ],
};
export default config;
