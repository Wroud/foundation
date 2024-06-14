import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import vite from "./vite.config";
import vue from "./vue.config";
import { getGAHeaders } from "./tools/getGAHeaders.ts";
import { sidebar } from "./data/sidebar.ts";
import { nav } from "./data/nav.ts";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Wroud Foundation",
  description: "Tools for modern js",
  srcDir: "./src",
  cleanUrls: true,
  lastUpdated: true,
  vite,
  vue,
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
    },
    codeTransformers: [transformerTwoslash()],
  },
  sitemap: {
    hostname: "https://wroud.dev",
    // transformItems(items) {
    //   return items.filter((item) => !item.url.includes("guide"));
    // },
  },

  /* prettier-ignore */
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
    // ['link', { rel: 'icon', type: 'image/png', href: '/vitepress-logo-mini.png' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#528de0' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Wround Foundation | Empowering Modern JS Development' }],
    ['meta', { property: 'og:site_name', content: 'Wround Foundation' }],
    // ['meta', { property: 'og:image', content: 'https://vitepress.dev/vitepress-og.jpg' }],
    ['meta', { property: 'og:url', content: 'https://wroud.dev/' }],
    ...getGAHeaders(),
  ],
  themeConfig: {
    logo: { src: "/icon.svg", width: 24, height: 24 },
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: "local",
    },
    editLink: {
      pattern:
        "https://github.com/wroud/foundation/edit/main/packages/docs/src/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      copyright: "Copyright © 2024-present Aleksei Potsetsuev",
      message: "Released under the MIT License.",
    },
    nav,
    sidebar,

    socialLinks: [
      { icon: "github", link: "https://github.com/Wroud/foundation" },
    ],
  },
});
