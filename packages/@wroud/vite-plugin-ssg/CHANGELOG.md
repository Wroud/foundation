<!-- header -->
# Changelog

All notable changes to this project will be documented in this file.

<!-- version:5.3.0 -->
## 5.3.0 (2025-05-28)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.2.0...vite-plugin-ssg-v5.3.0)

<!-- changelog -->
### ✨ Features

- better logging and builtin assets resolver for server API ([d46d1bf](https://github.com/Wroud/foundation/commit/d46d1bf))

<!-- version:5.2.0 -->
## 5.2.0 (2025-05-23)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.1.4...vite-plugin-ssg-v5.2.0)

<!-- changelog -->
### ✨ Features

- support assets inlining ([1d5208f](https://github.com/Wroud/foundation/commit/1d5208f))

### ⚙️  Refactor

- rename html tag utilities ([#25](https://github.com/Wroud/foundation/issues/25)) ([4bab8f2](https://github.com/Wroud/foundation/commit/4bab8f2))

<!-- version:5.1.4 -->
## 5.1.4 (2025-04-24)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.1.3...vite-plugin-ssg-v5.1.4)

<!-- changelog -->
### 🩹 Fixes

- improve module resolution logic ([ae24fa8](https://github.com/Wroud/foundation/commit/ae24fa8))

<!-- version:5.1.3 -->
## 5.1.3 (2025-04-24)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.1.2...vite-plugin-ssg-v5.1.3)

<!-- changelog -->
### 🩹 Fixes

- update dependencies ([cde6dc5](https://github.com/Wroud/foundation/commit/cde6dc5))

<!-- version:5.1.2 -->
## 5.1.2 (2025-04-22)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.1.1...vite-plugin-ssg-v5.1.2)

<!-- changelog -->
### 🩹 Fixes

- dependencies ([4d9200c](https://github.com/Wroud/foundation/commit/4d9200c))

<!-- version:5.1.1 -->
## 5.1.1 (2025-04-22)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.1.0...vite-plugin-ssg-v5.1.1)

<!-- changelog -->
### 🩹 Fixes

- optional dependencies ([c1f3c5f](https://github.com/Wroud/foundation/commit/c1f3c5f))
- optional nonce for script tags, add license ([934fe42](https://github.com/Wroud/foundation/commit/934fe42))

<!-- version:5.1.0 -->
## 5.1.0 (2025-04-19)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.0.1...vite-plugin-ssg-v5.1.0)

<!-- changelog -->
### ✨ Features

- better memory usage and resources disposing, better error logging ([4cdfa3c](https://github.com/Wroud/foundation/commit/4cdfa3c))

### 🩹 Fixes

- error when using multiple packages ([7560925](https://github.com/Wroud/foundation/commit/7560925))
- assets resolving (when asset resolved by another plugin) ([f8b44e9](https://github.com/Wroud/foundation/commit/f8b44e9))

<!-- version:5.0.1 -->
## 5.0.1 (2025-04-15)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v5.0.0...vite-plugin-ssg-v5.0.1)

<!-- changelog -->
### 🩹 Fixes

- revert pages middleware registration ([4e1f86d](https://github.com/Wroud/foundation/commit/4e1f86d))

<!-- version:5.0.0 -->
## 5.0.0 (2025-04-05)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v4.0.0...vite-plugin-ssg-v5.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- correcting pages generation; `?ssg` renamed to `?ssg-entry` ([34bab12](https://github.com/Wroud/foundation/commit/34bab12))
  - correcting pages generation; `?ssg` renamed to `?ssg-entry`

<!-- version:4.0.0 -->
## 4.0.0 (2025-03-26)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v3.0.0...vite-plugin-ssg-v4.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- better support for `base`; built-in navigation; dynamic routes pre-render ([0dfa60c](https://github.com/Wroud/foundation/commit/0dfa60c))
  - better support for `base`; built-in navigation; dynamic routes pre-render

<!-- version:3.0.0 -->
## 3.0.0 (2025-02-17)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v2.0.1...vite-plugin-ssg-v3.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- support linking multiple pages; split server and client artifacts; better dev experience ([20a1a4f](https://github.com/Wroud/foundation/commit/20a1a4f))
  - support linking multiple pages; split server and client artifacts; better dev experience

<!-- version:2.0.1 -->
## 2.0.1 (2025-02-07)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v2.0.0...vite-plugin-ssg-v2.0.1)

<!-- changelog -->
### 🩹 Fixes

- bump dependencies version ([91a7990](https://github.com/Wroud/foundation/commit/91a7990))

<!-- version:2.0.0 -->
## 2.0.0 (2025-01-27)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v1.0.0...vite-plugin-ssg-v2.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- support SSR manual generation, better support for CSP, support latest Vite, simple API ([0039c0b](https://github.com/Wroud/foundation/commit/0039c0b))
  - support SSR manual generation, better support for CSP, support latest Vite, simple API

<!-- version:1.0.0 -->
## 1.0.0 (2025-01-16)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.2.4...vite-plugin-ssg-v1.0.0)

<!-- changelog -->
### ⚠️  Breaking Changes

- use release version of react 19 ([12c94db](https://github.com/Wroud/foundation/commit/12c94db))
  - use release version of react 19

<!-- version:0.2.4 -->
## 0.2.4 (2024-11-28)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.2.3...vite-plugin-ssg-v0.2.4)

<!-- changelog -->
### 🩹 Fixes

- update dependencies ([d1d071a](https://github.com/Wroud/foundation/commit/d1d071a))

<!-- version:0.2.3 -->
## 0.2.3 (2024-11-26)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.2.2...vite-plugin-ssg-v0.2.3)

<!-- changelog -->
### 🩹 Fixes

- update dependencies ([25cddb7](https://github.com/Wroud/foundation/commit/25cddb7))

<!-- version:0.2.2 -->
## 0.2.2 (2024-11-19)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.2.1...vite-plugin-ssg-v0.2.2)

<!-- changelog -->
### 🩹 Fixes

- support external modules ([9176ad8](https://github.com/Wroud/foundation/commit/9176ad8))

<!-- version:0.2.1 -->
## 0.2.1 (2024-11-15)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.2.0...vite-plugin-ssg-v0.2.1)

<!-- changelog -->
### 🩹 Fixes

- publish resolvers js file ([1d2a306](https://github.com/Wroud/foundation/commit/1d2a306))

<!-- version:0.2.0 -->
## 0.2.0 (2024-11-13)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.1.2...vite-plugin-ssg-v0.2.0)

<!-- changelog -->
### ✨ Features

- expose resolvers module to allow imports ([c4fde87](https://github.com/Wroud/foundation/commit/c4fde87))

<!-- version:0.1.2 -->
## 0.1.2 (2024-11-13)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.1.1...vite-plugin-ssg-v0.1.2)

<!-- changelog -->
### 🩹 Fixes

- include resolvers type in npm package ([c215627](https://github.com/Wroud/foundation/commit/c215627))

<!-- version:0.1.1 -->
## 0.1.1 (2024-11-13)

[Compare changes](https://github.com/Wroud/foundation/compare/vite-plugin-ssg-v0.1.0...vite-plugin-ssg-v0.1.1)

<!-- changelog -->
### 🩹 Fixes

- include in ci build pipeline ([6c09118](https://github.com/Wroud/foundation/commit/6c09118))

<!-- version:0.1.0 -->
## 0.1.0 (2024-11-13)

<!-- changelog -->
### ✨ Features

- ssg for react ([7413d99](https://github.com/Wroud/foundation/commit/7413d99))

