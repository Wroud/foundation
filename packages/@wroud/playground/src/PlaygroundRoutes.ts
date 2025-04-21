export const PlaygroundRoutes = {
  root: "/",
  story: "/story/:story*",
  isolated: "/isolated/:story*",
  preview: "/preview/:story*",
  components: "/components",
} as const;
