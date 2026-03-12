# fetchData Utility

A robust, production-ready HTTP client wrapper around the native browser fetch API with automatic retries, timeout management, and predictable error handling.

## Features

- 🎯 **Try/Catch-Free**: Always returns a standardized `FetchResponse` object
- 🔄 **Smart Retries**: Automatic retries with exponential backoff
- 🏷️ **Error Categorization**: `http`, `network`, `timeout`, and `unknown` error types
- ⏱️ **Timeout Management**: Automatic request abortion after specified timeout
- 📦 **Type Safety**: Full TypeScript support with generics
- 🪶 **Lightweight**: No external dependencies

## Installation

```bash
npm install fetch-data-utility