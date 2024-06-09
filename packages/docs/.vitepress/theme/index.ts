import Theme from "vitepress/theme";
import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import "@shikijs/vitepress-twoslash/style.css";
import type { EnhanceAppContext } from "vitepress";
import "./custom.css";
import "./playground-links.css";
import "uno.css";

export default {
  extends: Theme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.use(TwoslashFloatingVue);
    enhanceAppWithTabs(app);
  },
};
