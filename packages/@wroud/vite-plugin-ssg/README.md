# @wroud/vite-plugin-ssg

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-ssg.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-ssg

`@wroud/vite-plugin-ssg` is a Vite plugin for rendering React applications statically to HTML. It allows for generating pre-rendered HTML files, improving SEO and initial loading times for client-side rendered apps.

## Features

- **Static Site Generation (SSG)**: Renders your React application to static HTML at build time.
- **Configurable Render Timeout**: Customize the render timeout for flexible rendering behavior.
- **React Refresh**: Supports React Refresh for a seamless development experience.
- **Hot Module Reload (HMR)**: Enables Hot Module Reload for faster iterative development.

## Requirements

- **React** 19 or higher
- **Vite** 6 or higher

## Installation

Install via npm:

```sh
npm install @wroud/vite-plugin-ssg
```

Install via yarn:

```sh
yarn add @wroud/vite-plugin-ssg
```

## Usage

### Options

`@wroud/vite-plugin-ssg` provides a configurable option:

```ts
interface SSGOptions {
  renderTimeout?: number;
}
```

### Example Configuration

To add `@wroud/vite-plugin-ssg` to your Vite application, follow these steps:

1. Import the plugin:

   ```ts
   import { ssgPlugin } from "@wroud/vite-plugin-ssg";
   ```

2. Add the plugin and configure the build entry point using `rollupOptions`:

   ```ts
   import path from "path";

   export default defineConfig({
     build: {
       rollupOptions: {
         input: {
           app: path.resolve("src/index.tsx") + "?ssg",
         },
       },
     },
     plugins: [ssgPlugin()],
   });
   ```

   Here, we specify the entry point with a `?ssg` query to signal SSG processing.

3. Create your `index.tsx` file with a default export for the `Index` component:

   ```tsx
   import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
   import { Html, Body, Head, Link } from "@wroud/vite-plugin-ssg/react/components";
   import indexStyles from "./index.css?url";
   import { App } from "./App.js";

   export default function Index(props: IndexComponentProps) {
     return (
       <Html lang="en" {...props}>
         <Head>
           <meta charSet="utf-8" />
           <meta
             name="viewport"
             content="width=device-width, initial-scale=1"
           />
           <title>Grid</title>
           <Link rel="stylesheet" href={indexStyles} />
         </Head>
         <Body>
           <App />
         </Body>
       </html>
     );
   }
   ```

   - Use a default export for the `Index` component.
   - Import styles with `?url` and add them as a `<Link>` component.

### Generated Output

When building the project, the following files will be generated:

- `app/index.js`: Contains the exported `render` function for SSG, which can be manually used to generate HTML.
- `app/index.html`: The statically generated HTML page.
- `assets/index-[hash].css`: The CSS file with styles.
- `assets/app/index-[hash].js`: The client bootstrap script.

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
