// Test symbolic computation support
var Algebra = require('./ganja.js');

console.log('=== Testing Symbolic Computation Support ===\n');

// Test 1: Basic symbolic operations in 2D
console.log('Test 1: Basic symbolic operations in 2D algebra');
var GA2D = Algebra({p:2, symbolic:true});

var a = new GA2D();
a[0] = "x";  // scalar
a[1] = "y";  // e1

var b = new GA2D();
b[0] = "z";  // scalar
b[1] = "w";  // e1

console.log('a =', a.toString());
console.log('b =', b.toString());

var sum = a.Add(b);
console.log('a + b =', sum.toString());

var diff = a.Sub(b);
console.log('a - b =', diff.toString());

var scaled = a.Scale("k");
console.log('a * k =', scaled.toString());

console.log('\n');

// Test 2: Symbolic multiplication
console.log('Test 2: Symbolic geometric product');
var v1 = new GA2D();
v1[1] = "a";  // e1
v1[2] = "b";  // e2

var v2 = new GA2D();
v2[1] = "c";  // e1
v2[2] = "d";  // e2

console.log('v1 =', v1.toString());
console.log('v2 =', v2.toString());

var product = v1.Mul(v2);
console.log('v1 * v2 =', product.toString());

console.log('\n');

// Test 3: Symbolic wedge product
console.log('Test 3: Symbolic wedge product');
var wedge = v1.Wedge(v2);
console.log('v1 ∧ v2 =', wedge.toString());

console.log('\n');

// Test 4: Rotor composition
console.log('Test 4: Symbolic rotor composition');
var rotor1 = new GA2D();
rotor1[0] = "cos(θ/2)";
rotor1[3] = "-sin(θ/2)";

var rotor2 = new GA2D();
rotor2[0] = "cos(φ/2)";
rotor2[3] = "-sin(φ/2)";

console.log('R1 =', rotor1.toString());
console.log('R2 =', rotor2.toString());

var composed = rotor2.Mul(rotor1);
console.log('R2 * R1 =', composed.toString());

if (composed.Simplify) {
  var simplified = composed.Simplify();
  console.log('Simplified =', simplified.toString());
}

console.log('\n');

// Test 5: Test with 3D algebra
console.log('Test 5: Symbolic operations in 3D algebra');
var GA3D = Algebra({p:3, symbolic:true});

var vec = new GA3D();
vec[1] = "x";
vec[2] = "y";
vec[3] = "z";

console.log('Vector v =', vec.toString());

var dual = vec.Dual;
console.log('Dual(v) =', dual.toString());

console.log('\n=== All tests completed ===');
