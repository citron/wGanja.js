# Symbolic Computation in Ganja.js

## Overview

Ganja.js now supports **symbolic computation** mode, enabling algebraic manipulations of multivectors symbolically rather than numerically. This is particularly useful for:

- **Theorem Proving**: Verify geometric algebra identities and theorems algebraically
- **Educational Demonstrations**: Show the structure of geometric operations clearly
- **Code Generation**: Generate optimized code from symbolic expressions
- **Automated Reasoning**: Perform algebraic manipulations programmatically

## Enabling Symbolic Mode

To enable symbolic computation, pass the `symbolic: true` option when creating an algebra:

```javascript
// Create a 2D Geometric Algebra with symbolic computation
var GA2D = Algebra({p:2, symbolic:true});

// Or for 3D
var GA3D = Algebra({p:3, symbolic:true});
```

## Creating Symbolic Multivectors

In symbolic mode, you can assign string expressions to multivector components:

```javascript
var v = new GA2D();
v[0] = "a";     // scalar part
v[1] = "x";     // e1 component
v[2] = "y";     // e2 component
v[3] = "b";     // e12 component

console.log(v.toString());
// Output: (a)+(x)e_1+(y)e_2+(b)e_12
```

## Symbolic Operations

All standard geometric algebra operations work symbolically:

### Addition and Subtraction

```javascript
var a = new GA2D();
a[1] = "x";
a[2] = "y";

var b = new GA2D();
b[1] = "u";
b[2] = "v";

var sum = a.Add(b);
console.log(sum.toString());
// Output: ((x+u))e_1+((y+v))e_2

var diff = a.Sub(b);
console.log(diff.toString());
// Output: ((x-u))e_1+((y-v))e_2
```

### Geometric Product

```javascript
var v1 = new GA2D();
v1[1] = "a";  // e1
v1[2] = "b";  // e2

var v2 = new GA2D();
v2[1] = "c";  // e1
v2[2] = "d";  // e2

var product = v1.Mul(v2);
console.log(product.toString());
// Output: ((a)*(c)+(b)*(d))+((a)*(d)-(b)*(c))e_12
```

### Wedge (Outer) Product

```javascript
var wedge = v1.Wedge(v2);
console.log(wedge.toString());
// Output: ((a)*(d)-(b)*(c))e_12
```

### Scalar Multiplication

```javascript
var scaled = v1.Scale("k");
console.log(scaled.toString());
// Output: ((a)*(k))e_1+((b)*(k))e_2
```

### Involutions

```javascript
var rev = v1.Reverse;     // Reversion
var inv = v1.Involute;    // Grade involution
var conj = v1.Conjugate;  // Conjugation
var neg = v1.Negative;    // Negation
```

### Duality

```javascript
var GA3D = Algebra({p:3, symbolic:true});

var v = new GA3D();
v[1] = "a";  // e1
v[2] = "b";  // e2
v[3] = "c";  // e3

var dual = v.Dual;
console.log(dual.toString());
// Output: ((c))e_12+(-(b))e_13+((a))e_23
// The dual of a vector in 3D is a bivector
```

## Symbolic Manipulation Methods

### Simplify()

The `Simplify()` method attempts to simplify symbolic expressions by:
- Removing unnecessary parentheses
- Eliminating identity operations (multiplication by 1, addition of 0)
- Simplifying double negatives
- Reducing nested expressions

```javascript
var composed = rotor1.Mul(rotor2);
var simplified = composed.Simplify();
```

### Expand()

The `Expand()` method distributes multiplication over addition (basic expansion):

```javascript
var expanded = expression.Expand();
```

Note: The expand function implements basic pattern matching. For complex expressions, multiple applications or manual manipulation may be needed.

## Example: Symbolic Rotor Composition

Rotors in geometric algebra are elements of the form `R = cos(θ/2) - sin(θ/2)e₁₂`. Here's how to compose two rotors symbolically:

```javascript
// Create 2D algebra with symbolic mode
var GA2D = Algebra({p:2, symbolic:true});

// First rotor (rotation by α)
var R1 = new GA2D();
R1[0] = "cos(α/2)";     // scalar part
R1[3] = "-sin(α/2)";    // e12 bivector part

// Second rotor (rotation by β)
var R2 = new GA2D();
R2[0] = "cos(β/2)";
R2[3] = "-sin(β/2)";

// Compose the rotors: R2 ∘ R1 = R2 * R1
var composed = R2.Mul(R1);
console.log("Composed:", composed.toString());
// Shows: ((cos(β/2))*(cos(α/2))-(-sin(β/2))*(-sin(α/2)))+...

// Simplify
var simplified = composed.Simplify();
console.log("Simplified:", simplified.toString());
```

This demonstrates the group property of rotors: composing rotations by α and β results in a rotation by (α + β).

## Example: Symbolic Duality in 3D

Duality is a fundamental operation in geometric algebra. In 3D:
- The dual of a vector (grade 1) is a bivector (grade 2)
- The dual of a bivector is a vector
- The dual of dual returns the original element (with a sign change in 3D)

```javascript
var GA3D = Algebra({p:3, symbolic:true});

// Define a symbolic vector
var v = new GA3D();
v[1] = "a";  // e1
v[2] = "b";  // e2
v[3] = "c";  // e3

// Compute dual
var dualV = v.Dual;
console.log("Dual(v):", dualV.toString());
// Output: ((c))e_12+(-(b))e_13+((a))e_23

// Double dual
var doubleDual = dualV.Dual;
console.log("Dual(Dual(v)):", doubleDual.toString());

var simplified = doubleDual.Simplify();
console.log("Simplified:", simplified.toString());
// Output: (-a)e_1+(-b)e_2+(-c)e_3
// Shows that Dual(Dual(v)) = -v in 3D (I² = -1)
```

## Example: Symbolic Cross Product via Wedge and Dual

The cross product in 3D can be expressed using the wedge product and duality:

```javascript
var v1 = new GA3D();
v1[1] = "x1"; v1[2] = "y1"; v1[3] = "z1";

var v2 = new GA3D();
v2[1] = "x2"; v2[2] = "y2"; v2[3] = "z2";

// Wedge product gives a bivector
var wedge = v1.Wedge(v2);
console.log("v1 ∧ v2:", wedge.toString());
// Output: ((x1)*(y2)-(y1)*(x2))e_12+((x1)*(z2)-(z1)*(x2))e_13+((y1)*(z2)-(z1)*(y2))e_23

// Dual converts to the cross product vector
var crossProduct = wedge.Dual;
console.log("Dual(v1 ∧ v2):", crossProduct.toString());
// This gives the components of the cross product v1 × v2
```

## Practical Applications

### 1. Theorem Verification

Verify geometric identities symbolically:

```javascript
// Verify that (a∧b)∧c + (b∧c)∧a + (c∧a)∧b = 0 (Jacobi identity)
var lhs = a.Wedge(b).Wedge(c).Add(b.Wedge(c).Wedge(a)).Add(c.Wedge(a).Wedge(b));
var simplified = lhs.Simplify();
// Check if all components are zero
```

### 2. Educational Tools

Display step-by-step algebraic manipulations:

```javascript
console.log("Step 1:", expr1.toString());
console.log("Step 2:", expr1.Mul(expr2).toString());
console.log("Step 3:", expr1.Mul(expr2).Simplify().toString());
```

### 3. Code Generation

Generate optimized numerical code from symbolic expressions:

```javascript
var symbolic = rotorA.Mul(rotorB);
var expr = symbolic.Simplify().toString();
// Use expr to generate optimized code in target language
```

## Limitations

1. **Complexity**: The symbolic system uses string manipulation, which can become complex for deeply nested expressions.

2. **Simplification**: The `Simplify()` method implements pattern-based simplification. It may not find all possible simplifications, especially for complex trigonometric or algebraic identities.

3. **Performance**: Symbolic operations are slower than numeric operations. Use symbolic mode for derivation and verification, not for performance-critical numerical computations.

4. **Dimension Limit**: Currently, symbolic mode works best with the flat generator (algebras with ≤6 dimensions). Higher-dimensional algebras already have some symbolic support in the graded generator.

## Combining Numeric and Symbolic

You can mix numeric and symbolic values:

```javascript
var mixed = new GA2D();
mixed[0] = 1.5;      // numeric scalar
mixed[1] = "x";      // symbolic e1 component
mixed[2] = 3.0;      // numeric e2 component

var result = mixed.Scale("k");
// Result will have both numeric and symbolic components
```

## See Also

- [example_symbolic_rotor_composition.html](examples/example_symbolic_rotor_composition.html) - Interactive example of rotor composition
- [example_symbolic_duality.html](examples/example_symbolic_duality.html) - Interactive example of duality operations

## Future Enhancements

Potential future improvements to symbolic computation:

- Integration with symbolic math libraries (e.g., SymPy via WebAssembly)
- Advanced simplification using trigonometric identities
- Automatic factorization and expansion
- LaTeX output for symbolic expressions
- Symbolic differentiation and integration
