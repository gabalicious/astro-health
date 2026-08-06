// @ts-check
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [vue(), svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
