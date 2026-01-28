# DCGA3D Implementation for wGanja.js

This document describes the implementation of Double Conformal Geometric Algebra (DCGA3D) support in wGanja.js.

## Overview

DCGA3D extends traditional Conformal Geometric Algebra (CGA) by adding a second conformal dimension, enabling the representation of oriented contact elements (points with normals). This is particularly useful for:

- Robotics and kinematic chains with contact constraints
- Complex shape representations
- Surface contact modeling
- Advanced geometric transformations

## Mathematical Foundation

**Metric**: (6,2) - 6 positive dimensions, 2 negative dimensions  
**Algebra Size**: 2^8 = 256 basis elements

### Null Basis Structure

DCGA3D uses two sets of conformal dimensions:

```javascript
// First conformal space (for positions)
var ep1 = 1e4, em1 = 1e5;
var no1 = 0.5*(em1 - ep1);  // Origin
var ni1 = ep1 + em1;         // Infinity

// Second conformal space (for orientations)
var ep2 = 1e6, em2 = 1e7;
var no2 = 0.5*(em2 - ep2);  // Origin
var ni2 = ep2 + em2;         // Infinity

// Combined
var no = no1 + no2;
var ni = ni1 + ni2;
```

## Implementation Details

### JavaScript Example

File: `examples/example_dcga3d_kinematic_chain.html`

Features:
- 3D kinematic chain with 4 joints
- Forward kinematics computation
- Animated robot arm visualization
- Reference spheres for spatial context
- Conformal rendering with WebGL

Key functions:
```javascript
// Upcast 3D point to DCGA
var up = (x,y,z) => {
  var p = x*e1 + y*e2 + z*e3;
  var psq = x*x + y*y + z*z;
  return no + p + 0.5*psq*ni;
};

// Oriented point (point + normal)
var oriented_point = (x,y,z,nx,ny,nz) => {
  var p = up(x,y,z);
  var n = nx*e1 + ny*e2 + nz*e3;
  return p + n*ni2;
};

// Sphere
var sphere = (x,y,z,r) => {
  var c = up(x,y,z);
  return c - 0.5*r*r*ni;
};
```

### Codegen Templates

Added DCGA3D sections to all template files:

1. **C++ Template** (`codegen/cpp.template.js`)
   - Static basis vectors
   - Null basis functions
   - Example with points, spheres, and oriented points

2. **C# Template** (`codegen/cs.template.js`)
   - Public static fields for basis
   - Helper methods for geometric primitives
   - Main program example

3. **Python Template** (`codegen/py.template.js`)
   - Class-based implementation
   - Function definitions in main block
   - NumPy-compatible array handling

4. **Rust Template** (`codegen/rs.template.js`)
   - Trait-based operator overloading
   - Public methods for geometric operations
   - Type-safe implementation

### Generated Code

All generated files include:
- Full basis blade definitions (256 elements)
- Geometric product implementation
- Wedge (outer) product
- Vee (regressive) product
- Inner (dot) product
- Unary operators (reverse, dual, conjugate, involute)
- Normalization functions
- Example usage code

Generated files:
- `codegen/cpp/dcga3d.cpp` (1.3MB)
- `codegen/csharp/dcga3d.cs`
- `codegen/python/dcga3d.py` (✓ tested)
- `codegen/rust/dcga3d.rs`

## Usage

### JavaScript

```html
<SCRIPT SRC="../ganja.js"></SCRIPT>
<SCRIPT>
Algebra(6,2,()=>{ 
  // Your DCGA3D code here
});
</SCRIPT>
```

### Code Generation

```bash
# Generate all languages
cd codegen && node generate.js DCGA3D

# Generate specific language
cd codegen && make GEN_LANG="python" dcga3d

# Run Python example
python3 codegen/python/dcga3d.py
```

## Testing

- ✓ Python implementation verified working
- ✓ JavaScript example validated for structure
- ✓ All templates properly generate code
- ✓ Documentation updated across all targets

## Performance Notes

- DCGA3D has 256 basis elements, making it a large algebra
- C++ compilation may be slow due to file size (1.3MB)
- Python and JavaScript implementations are optimized for clarity
- Consider using sparse representations for production code

## References

- [Double Conformal Geometric Algebra (Springer)](https://link.springer.com/chapter/10.1007/978-3-319-74830-6_13)
- [Research on Double Conformal GA](https://www.researchgate.net/publication/226450308_Double_Conformal_Geometric_Algebra)
- Original CGA3D implementation in wGanja.js

## Future Enhancements

Potential improvements:
- Inverse kinematics solver using DCGA3D
- Contact constraint solver for rigid body dynamics
- Advanced surface fitting algorithms
- Integration with physics engines

---

Implemented by GitHub Copilot Workspace
Date: January 2026
