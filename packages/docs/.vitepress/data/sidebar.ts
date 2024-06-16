import { DefaultTheme } from "vitepress";

export const sidebar: DefaultTheme.Sidebar = {
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
              {
                text: "Scale",
                base: "/guide/package/di/scaling/",
                items: [
                  {
                    text: "Introduction",
                    link: "introduction",
                  },
                  { text: "Integration", link: "integration" },
                ],
              },
            ],
          },
          {
            text: "DI Tools",
            link: "di-tools/",
            items: [
              {
                text: "Analyzer",
                base: "/guide/package/di-tools/analyzer/",
                items: [
                  { text: "Introduction", link: "introduction" },
                  { text: "Live Demo", link: "live-demo" },
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
};
