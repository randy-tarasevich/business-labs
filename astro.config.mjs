// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Update when the domain is chosen (used for canonical URLs and the sitemap later).
  site: 'https://business-labs.randy-tarasevich.workers.dev',
  vite: {
    plugins: [tailwindcss()],
  },
});
