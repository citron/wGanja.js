# TypeScript Support for Ganja.js

This document describes the TypeScript setup for the Ganja.js library.

## Overview

Ganja.js has been enhanced with TypeScript support while maintaining full backward compatibility with the existing JavaScript codebase. The library is compiled using TypeScript but the source is primarily JavaScript with comprehensive type definitions provided.

## Structure

```
wGanja.js/
├── src/               # TypeScript source files
│   ├── ganja.js       # Main library (JavaScript with type definitions)
│   ├── ganja.d.ts     # Comprehensive type definitions
│   └── coffeeshop.js  # Example utilities
├── dist/              # Compiled output (generated)
│   ├── ganja.js       # Compiled library
│   ├── ganja.d.ts     # Type declarations
│   ├── ganja.js.map   # Source maps
│   └── ...
├── tsconfig.json      # TypeScript configuration
└── package.json       # Updated with build scripts
```

## Building

The library can be built using npm scripts:

```bash
# Build once
npm run build

# Build and watch for changes
npm run watch

# Automatic build before npm publish
npm run prepare
```

## TypeScript Configuration

The `tsconfig.json` is configured to:
- Target ES2015 (compatible with modern browsers and Node.js)
- Generate CommonJS modules for Node.js compatibility
- Allow JavaScript files to coexist with TypeScript
- Generate declaration files (.d.ts) for TypeScript consumers
- Create source maps for debugging
- Use relaxed type checking to allow gradual migration

## Type Definitions

The library includes comprehensive type definitions in `src/ganja.d.ts`:

### Core Interfaces

- **`AlgebraOptions`**: Configuration options for creating algebras
- **`Element`**: Multivector elements with all operations
- **`AlgebraClass`**: Algebra class constructor and static methods
- **`AlgebraFunction`**: Main function with overloaded signatures

### Usage in TypeScript

```typescript
import Algebra from 'ganja.js';

// Create a complex number algebra
const complex = Algebra(0, 1);

// Create elements with type checking
const a = new complex([3, 2]);
const b = new complex([1, 4]);

// Operations are fully typed
const result: Element = a.Mul(b);

// Use inline syntax
const computed = Algebra(0, 1, () => (3 + 2e1) * (1 + 4e1));
```

### Key Types

**Element Operations**:
- Geometric: `Mul`, `Div`
- Outer: `Wedge` (meet)
- Regressive: `Vee` (join)
- Inner: `Dot`, `LDot`
- Arithmetic: `Add`, `Sub`, `Scale`

**Element Properties**:
- Grades: `Grade`, `Even`, `Vector`
- Involutions: `Reverse`, `Involute`, `Conjugate`, `Dual`
- Metrics: `Length`, `VLength`, `Normalized`, `Inverse`

## Codegen Integration

The code generator (`codegen/generate.js`) has been updated to use the compiled TypeScript output:

```javascript
Algebra = require('../dist/ganja.js');
```

This allows the code generator to benefit from the TypeScript build while maintaining its functionality.

## Examples

Examples continue to load from their original location but can reference the compiled output:

```html
<SCRIPT SRC="../dist/ganja.js"></SCRIPT>
```

Or the original location for backward compatibility:

```html
<SCRIPT SRC="../ganja.js"></SCRIPT>
```

## Migration Path

The current setup allows for gradual migration:

1. **Phase 1 (Current)**: JavaScript source with comprehensive type definitions
2. **Phase 2 (Future)**: Gradual conversion of modules to TypeScript
3. **Phase 3 (Future)**: Full TypeScript implementation with strict type checking

## Testing

Test the build output:

```bash
# Test basic algebra operations
node -e "const Algebra = require('./dist/ganja.js'); \
  const complex = Algebra(0,1); \
  const a = new complex([3,2]); \
  const b = new complex([1,4]); \
  console.log(a.Mul(b).toString());"
```

Expected output: `-5+14i`

## Benefits

1. **Type Safety**: TypeScript consumers get full IntelliSense and type checking
2. **Better IDE Support**: Autocompletion and inline documentation
3. **Maintainability**: Clearer API contracts and interfaces
4. **Documentation**: Type definitions serve as executable documentation
5. **Backward Compatibility**: Existing JavaScript code works unchanged

## Notes

- The library uses Float32Array for efficient multivector storage
- Type definitions cover all major algebra operations
- Source maps enable debugging TypeScript in browsers
- The build process is integrated with npm workflows
