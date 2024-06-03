import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import vite from "./vite.config";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Wroud Foundation",
  description: "Tools for modern js",
  srcDir: "./src",
  cleanUrls: true,
  lastUpdated: true,
  vite,
  markdown: {
    codeTransformers: [transformerTwoslash()],
  },
  sitemap: {
    hostname: "https://wroud.dev",
    // transformItems(items) {
    //   return items.filter((item) => !item.url.includes('migration'))
    // }
  },

  /* prettier-ignore */
  head: [
    // ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vitepress-logo-mini.svg' }],
    // ['link', { rel: 'icon', type: 'image/png', href: '/vitepress-logo-mini.png' }],
    ['meta', { name: 'theme-color', content: '#528de0' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Wround Foundation | Empowering Modern JS Development' }],
    ['meta', { property: 'og:site_name', content: 'Wround Foundation' }],
    // ['meta', { property: 'og:image', content: 'https://vitepress.dev/vitepress-og.jpg' }],
    ['meta', { property: 'og:url', content: 'https://wroud.dev/' }],
  ],
  themeConfig: {
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

    /* prettier-ignore */
    nav: [
      { text: "guide", link: "/guide/markdown-examples", activeMatch: "/guide/" },
      { text: "packages", link: "/packages/overview", activeMatch: "/packages/" },
    ],

    sidebar: {
      "/guide/": {
        base: "/guide/",
        items: [
          {
            text: "Examples",
            collapsed: false,
            items: [
              { text: "Markdown Examples", link: "markdown-examples" },
              { text: "Runtime API Examples", link: "api-examples" },
            ],
          },
        ],
      },
      "/packages/": {
        base: "/packages/",
        items: [
          {
            text: "Packages",
            collapsed: false,
            items: [
              { text: "Overview", link: "overview" },
              {
                text: "Dependency Injection",
                base: "/packages/di/",
                items: [
                  { text: "Overview", link: "overview" },
                  { text: "Installation", link: "install" },
                  { text: "Usage", link: "usage" },
                  { text: "API", link: "api" },
                ],
              },
            ],
          },
        ],
      },
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/Wroud/foundation" },
    ],
  },
});
