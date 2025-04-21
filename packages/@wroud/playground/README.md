# @wroud/playground

[![ESM-only package][package]][esm-info-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

@wroud/playground is an internal package that provides core functionality for the component playground system. It defines the routing and context interfaces used by the playground environment.

## Features

- **Route Definitions**: Provides standard route paths for playground navigation
- **Context Interface**: Defines the playground context structure
- **Navigation Support**: Integrates with @wroud/navigation for pattern matching
- [Pure ESM package][esm-info-url]

## Internal Use

This package is intended for internal use within the @wroud ecosystem and works together with:
- @wroud/vite-plugin-playground
- @wroud/playground-react

It should not be installed directly but is included as a dependency by the public playground packages.
