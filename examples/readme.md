# Execa Examples

This directory contains practical examples demonstrating common use cases with `execa`.

## Examples

### build-script.js
Build automation with error handling. Shows how to chain build commands and handle failures gracefully.

```bash
node examples/build-script.js
```

### git-helpers.js
Git operation wrappers. Demonstrates async helper functions for common git operations.

```bash
node examples/git-helpers.js
```

### parallel-tasks.js
Running commands in parallel. Shows concurrent execution with `Promise.allSettled()` and progress tracking.

```bash
node examples/parallel-tasks.js
```

### stream-processing.js
Output filtering with transforms. Demonstrates using Node.js Transform streams to process command output.

```bash
node examples/stream-processing.js
```

## Notes

- All examples use ES modules (`.js` extension with `import` syntax)
- Each example can be run directly or imported as a module
- Error handling is included in all examples
