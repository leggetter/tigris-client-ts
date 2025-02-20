# Tigris TypeScript Client Library

[![npm](https://img.shields.io/npm/v/@tigrisdata/core)](https://www.npmjs.com/package/@tigrisdata/core)
[![ts-ci](https://github.com/tigrisdata/tigris-client-ts/actions/workflows/ts-ci.yml/badge.svg?branch=main)](https://github.com/tigrisdata/tigris-client-ts/actions/workflows/ts-ci.yml)
[![codecov](https://codecov.io/gh/tigrisdata/tigris-client-ts/branch/main/graph/badge.svg)](https://codecov.io/gh/tigrisdata/tigris-client-ts)
![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/tigrisdata/tigris-client-ts)
[![discord](https://img.shields.io/badge/discord-tigrisdata-34D058.svg?logo=discord)](https://www.tigrisdata.com/discord/)
[![GitHub](https://img.shields.io/github/license/tigrisdata/tigris-client-ts)](https://github.com/tigrisdata/tigris-client-ts/blob/main/LICENSE)

# Documentation

- [Tigris Overview](https://www.tigrisdata.com/docs/concepts/)
- [Getting Started](https://www.tigrisdata.com/docs/quickstarts/)
- [Database](https://www.tigrisdata.com/docs/sdkstools/typescript/database/)
- [Search](https://www.tigrisdata.com/docs/sdkstools/typescript/database/search/)

# Building

```
# clean the dev env
npm run clean

# build
npm run build

# test
npm run test

# lint
npm run lint
```

# Installation note for Apple M1

Since ARM binaries are not provided for `grpc-tools` package by the grpc team. Hence, the x86_64
version of `grpc-tools` must be installed.

```shell
npm_config_target_arch=x64 npm i grpc-tools
npm i
```

# Code Quality

## 1. Linting

The coding style rules are defined by [Prettier](https://prettier.io/) and
enforced by [Eslint](https://eslint.org)

## 2. Git Hooks

We use [pre-commit](https://pre-commit.com/index.html) to automatically
setup and run git hooks.

Install the pre-commit hooks as follows:

```shell
pre-commit install
```

On every `git commit` we check the code quality using prettier and eslint.

# License

This software is licensed under the [Apache 2.0](LICENSE).
