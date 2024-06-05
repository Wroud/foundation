import { HeadConfig } from "vitepress";

export function getGAHeaders(): HeadConfig[] {
  if (process.env.NODE_ENV !== "production") {
    return [];
  }

  return [
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-8F954Z5B1Z",
      },
    ],
    [
      "script",
      {},
      "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-8F954Z5B1Z');",
    ],
  ];
}
