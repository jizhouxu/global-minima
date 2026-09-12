// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Origin precedence: shell/deployment SITE_URL, Vercel production URL, localhost.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'never',

  output: 'static',
  // Preserve spaces between inline elements.
  compressHTML: true,

  integrations: [
    // MDX inherits the shared unified processor and Shiki themes below.
    mdx(),
    sitemap({
      serialize(item) {
        // Strip trailing slash for consistency with trailingSlash: 'never'
        if (item.url.endsWith('/') && item.url !== site + '/') {
          item.url = item.url.slice(0, -1);
        }
        const url = item.url;
        if (url === site || url === site + '/') {
          item.priority = 1.0;
          item.changefreq = ChangeFreqEnum.DAILY;
          item.lastmod = new Date().toISOString();
        } else if (url.endsWith('/about') || url.endsWith('/writing')) {
          item.priority = 0.9;
          item.changefreq = ChangeFreqEnum.WEEKLY;
        } else if (url.includes('/writing/')) {
          item.priority = 0.7;
          item.changefreq = ChangeFreqEnum.MONTHLY;
        } else if (url.includes('/tags/')) {
          item.priority = 0.3;
          item.changefreq = ChangeFreqEnum.YEARLY;
        }
        return item;
      },
    }),
  ],

  vite: {
    // Tailwind v4 compiles through Vite.
    plugins: [tailwindcss()],
  },

  markdown: {
    // Shared math processing for Markdown and MDX.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    // CSS selects Shiki's syntax colors for the active site theme.
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },
});
