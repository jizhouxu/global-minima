// @ts-check
import { fileURLToPath } from 'node:url';
import siteConfig from '../../../astro.config.mjs';

// Exercise the site's real integrations and Markdown settings. Keep generated
// types, caches and HTML out of both the source fixture and production dist/.
/** @type {typeof siteConfig} */
const fixtureConfig = {
  ...siteConfig,
  base: '/fixture',
  srcDir: fileURLToPath(new URL('./src/', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public/', import.meta.url)),
  outDir: fileURLToPath(new URL('../../../.tmp/rendering/dist/', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../../.tmp/rendering/cache/', import.meta.url)),
};

export default fixtureConfig;
