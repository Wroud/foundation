# @wroud/playground-react

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/playground-react.svg
[npm-url]: https://npmjs.com/package/@wroud/playground-react

@wroud/playground-react is a React library for creating component stories and demos. It provides a simple API to describe and showcase React components, designed to work with the @wroud/vite-plugin-playground ecosystem.

## Features

- **Component Showcasing**: Easily create interactive examples of your React components
- **Nested Descriptions**: Organize your components into logical groups
- **Preview Support**: Create compact previews for components in navigation
- **TypeScript**: Written in TypeScript for type safety
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/playground-react
```

Install via yarn

```sh
yarn add @wroud/playground-react
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```tsx
import { describe, story } from "@wroud/playground-react";
import { Button } from "./Button";

describe("Buttons", () => {
  story(
    "Default",
    function DefaultButtonStory() {
      return <Button>Click Me</Button>;
    }
  );
  
  story(
    "Primary",
    function PrimaryButtonStory() {
      return <Button variant="primary">Primary Button</Button>;
    },
    {
      preview: true,
      description: "A primary button with higher visual prominence"
    }
  );
});
```

## API Reference

### describe(name, callback)

Creates a group of related stories.

- `name`: The name of the group
- `callback`: A function containing story definitions

### story(name, component, options?)

Defines a component story.

- `name`: The name of the story
- `component`: React component rendering the story
- `options`: Optional configuration
  - `preview`: Component for preview or `true` to use the main component
  - `description`: Short description of the story
  - `props`: A [Standard Schema](https://standardschema.dev) with JSON Schema support (Zod 4.2+, ArkType 2.1.28+) describing the component props. The playground renders controls for it and passes the values to `component`.
  - `states`: Named prop presets selectable in the controls panel

```tsx
import { z } from "zod";

story(
  "Button",
  ({ label, variant, size }) => (
    <button data-variant={variant} style={{ fontSize: size }}>
      {label}
    </button>
  ),
  {
    props: z.object({
      label: z.string().default("Click me").describe("Button text"),
      variant: z.enum(["primary", "ghost"]),
      size: z.number().min(8).max(48).default(16).meta({ control: "range" }),
    }),
    states: { large: { size: 32, label: "Large" } },
  },
);
```

Controls are picked from the JSON Schema: `enum` and literal unions render a select, `boolean` a checkbox, `string` a text input (`format: "color"` or `control: "color"` a color picker, `control: "textarea"` a textarea), `number`/`integer` a number input (`control: "range"` with `minimum`/`maximum` a slider), nested objects a fieldset, and everything else a JSON editor. Initial values come from `default`.

### useStoryPanel({ actions?, values? })

Adds buttons and read-only values to the controls panel from inside a story component.

- `actions`: Button labels mapped to callbacks that run in the story
- `values`: Labels mapped to strings, numbers, booleans or `null`

```tsx
function TreeStory({ depth }: { depth: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const tree = useTreeData({ depth, onSelect: setSelected });

  useStoryPanel({
    actions: { "Select first node": () => tree.selectNode("root-0", true) },
    values: { "Selected node": selected },
  });

  return <Tree tree={tree} />;
}
```

### Story channel

`@wroud/playground-react/channel` connects the playground page with the story running in its iframe. Story props, `useStoryPanel` and the controls panel are built on it, and it can carry any other data between the two sides.

```tsx
import {
  defineStoryTopic,
  useChannelListener,
  useChannelPublish,
  useStoryChannel,
} from "@wroud/playground-react/channel";

const viewportTopic = defineStoryTopic<{ width: number }>("my-plugin:viewport");

function useViewportReport(width: number) {
  const channel = useStoryChannel();
  useChannelPublish(channel, viewportTopic, { width });
}
```

- `defineStoryTopic<T>(name)`: a typed topic; payloads must be structured-cloneable
- `StoryChannel`: `send(topic, payload)`, `on(topic, listener)`, `onConnect(listener)` (runs on every connect and reconnect of the other side, and immediately when already connected), `open()` (returns `close`)
- `useStoryChannel()`: the channel of the current story, inside the story iframe and in the playground's panel, `null` outside the playground
- `useHostChannel(storyId)`: `{ channel, iframeRef }` for the page that renders the story iframe; pass `iframeRef` to `IframeView`
- `useFrameChannel(storyId)`: the iframe side; `StoryFrame` from `@wroud/playground-react/views` creates it and provides it to stories through `StoryChannelContext`
- `useChannelListener(channel, topic, listener)`: subscribes to a topic
- `useChannelPublish(channel, topic, payload)`: sends the payload when it changes and again whenever the other side connects
- Topics used by the playground: `storyValuesTopic` (control values), `storyIssuesTopic` (validation issues), `storyPanelTopic` (panel actions and values) and `storyActionTopic` (action button clicks), all from `@wroud/playground-react/controls`

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
