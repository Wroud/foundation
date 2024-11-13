// copy from https://github.com/vitejs/vite/blob/main/packages/vite/src/node/constants.ts

export const KNOWN_ASSET_TYPES = [
  // resources
  "css",
  "scss",
  "sass",
  "less",

  // images
  "apng",
  "bmp",
  "png",
  "jpe?g",
  "jfif",
  "pjpeg",
  "pjp",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",

  // media
  "mp4",
  "webm",
  "ogg",
  "mp3",
  "wav",
  "flac",
  "aac",
  "opus",
  "mov",
  "m4a",
  "vtt",

  // fonts
  "woff2?",
  "eot",
  "ttf",
  "otf",

  // other
  "webmanifest",
  "pdf",
  "txt",
];

export const DEFAULT_DIST = ["dist", "lib", "build", "out", "output"];
export const DEFAULT_SRC = ["src", "source", "app", "assets"];
