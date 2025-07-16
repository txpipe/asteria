import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tx3Plugin from 'vite-plugin-tx3';

export default defineConfig({
  server: {
    allowedHosts: ['asteria.joystick.local'],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), tx3Plugin()],
});
