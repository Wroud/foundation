import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import vite from "./vite.config";
import { getGAHeaders } from "./tools/getGAHeaders.ts";

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

    /* prettier-ignore */
    nav: [
      { text: "guide", link: "/guide/", activeMatch: "/guide/" },
      { text: "packages", link: "/packages/overview", activeMatch: "/packages/" },
    ],

    sidebar: {
      "/guide/": {
        base: "/guide",
        items: [
          { text: "Introduction", link: "/" },
          {
            text: "Packages",
            base: "/guide/package/",
            collapsed: false,
            items: [
              {
                text: "Dependency Injection",
                link: "di/",
                items: [
                  {
                    text: "Getting Started",
                    base: "/guide/package/di/getting-started/",
                    items: [
                      { text: "Introduction", link: "introduction" },
                      { text: "Installation", link: "installation" },
                      {
                        text: "Why DI?",
                        link: "why-use-dependency-injection",
                      },
                    ],
                  },
                  {
                    text: "Core Concepts",
                    base: "/guide/package/di/core-concepts/",
                    items: [
                      { text: "Service Container", link: "service-container" },
                      { text: "Service Lifetimes", link: "service-lifetimes" },
                      {
                        text: "Dependency Injection",
                        link: "dependency-injection",
                      },
                    ],
                  },
                  {
                    text: "Advanced Features",
                    base: "/guide/package/di/advanced-features/",
                    items: [
                      {
                        text: "Manual Service Registration",
                        link: "manual-service-registration",
                      },
                      { text: "Factory Services", link: "factory-services" },
                      { text: "Service Disposal", link: "service-disposal" },
                    ],
                  },
                ],
              },
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
