#!/usr/bin/env node

/**
 * Float64Array Precision Example for Ganja.js
 * 
 * This Node.js example demonstrates the precision improvements when using
 * Float64Array (double precision) instead of the default Float32Array 
 * (single precision) for geometric algebra operations.
 * 
 * Run with: node examples/example_precision_float64.js
 */

const Algebra = require('../ganja.js');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Float64Array Precision Enhancement in Ganja.js');
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Test 1: Iterative Accumulation
 * Demonstrates how rounding errors accumulate in iterative computations
 */
function test1_iterativeAccumulation() {
  console.log('TEST 1: Iterative Accumulation');
  console.log('─────────────────────────────────────────────────────────');
  
  const iterations = 1000000;
  const smallValue = 1e-7;
  
  // Float32Array (default)
  const Alg32 = Algebra(3);
  const a32 = new Alg32();
  a32[0] = 0;
  for (let i = 0; i < iterations; i++) {
    a32[0] += smallValue;
  }
  const result32 = a32[0];
  
  // Float64Array
  const Alg64 = Algebra({p:3, baseType: Float64Array});
  const a64 = new Alg64();
  a64[0] = 0;
  for (let i = 0; i < iterations; i++) {
    a64[0] += smallValue;
  }
  const result64 = a64[0];
  
  const expected = iterations * smallValue;
  const error32 = Math.abs((result32 - expected) / expected);
  const error64 = Math.abs((result64 - expected) / expected);
  
  console.log(`  Configuration: Adding ${smallValue.toExponential(1)} for ${iterations.toLocaleString()} iterations`);
  console.log(`  Expected:      ${expected.toExponential(10)}`);
  console.log(`  Float32Array:  ${result32.toExponential(10)} (error: ${error32.toExponential(3)})`);
  console.log(`  Float64Array:  ${result64.toExponential(10)} (error: ${error64.toExponential(3)})`);
  console.log(`  ✓ Improvement: ${(error32 / error64).toFixed(0)}× more accurate\n`);
}

/**
 * Test 2: High-Precision Scalar Difference
 * Shows precision limits with very small differences
 */
function test2_highPrecisionScalars() {
  console.log('TEST 2: High-Precision Scalar Operations');
  console.log('─────────────────────────────────────────────────────────');
  
  const value1 = 1.0 + 1e-8;
  const value2 = 1.0;
  
  // Float32Array
  const Alg32 = Algebra(2);
  const a32 = new Alg32();
  const b32 = new Alg32();
  a32[0] = value1;
  b32[0] = value2;
  const diff32 = a32.Sub(b32)[0];
  
  // Float64Array
  const Alg64 = Algebra({p:2, baseType: Float64Array});
  const a64 = new Alg64();
  const b64 = new Alg64();
  a64[0] = value1;
  b64[0] = value2;
  const diff64 = a64.Sub(b64)[0];
  
  const expected = 1e-8;
  const error32 = diff32 === 0 ? 1.0 : Math.abs((diff32 - expected) / expected);
  const error64 = Math.abs((diff64 - expected) / expected);
  
  console.log(`  Configuration: Computing (1.0 + 1e-8) - (1.0)`);
  console.log(`  Expected:      ${expected.toExponential(10)}`);
  console.log(`  Float32Array:  ${diff32.toExponential(10)} (error: ${error32.toExponential(3)})`);
  console.log(`  Float64Array:  ${diff64.toExponential(10)} (error: ${error64.toExponential(3)})`);
  console.log(`  ✓ Float64Array preserves precision where Float32Array loses it\n`);
}

/**
 * Test 3: Inverse Computation Accuracy
 * Tests numerical stability in matrix-like operations
 */
function test3_inverseAccuracy() {
  console.log('TEST 3: Inverse Computation Accuracy');
  console.log('─────────────────────────────────────────────────────────');
  
  // Float32Array
  const Alg32 = Algebra(3);
  const a32 = new Alg32([2, 3, 4, 5, 6, 7, 8, 9]);
  const inv32 = a32.Inverse;
  const product32 = a32.Mul(inv32);
  const error32 = Math.abs(product32[0] - 1) + 
                  product32.slice(1).reduce((sum, x) => sum + Math.abs(x), 0);
  
  // Float64Array
  const Alg64 = Algebra({p:3, baseType: Float64Array});
  const a64 = new Alg64([2, 3, 4, 5, 6, 7, 8, 9]);
  const inv64 = a64.Inverse;
  const product64 = a64.Mul(inv64);
  const error64 = Math.abs(product64[0] - 1) + 
                  product64.slice(1).reduce((sum, x) => sum + Math.abs(x), 0);
  
  console.log(`  Configuration: Computing A × A⁻¹ and measuring deviation from identity`);
  console.log(`  Float32Array:  Total error = ${error32.toExponential(3)}`);
  console.log(`  Float64Array:  Total error = ${error64.toExponential(3)}`);
  console.log(`  ✓ Improvement: ${(error32 / error64).toFixed(0)}× more accurate\n`);
}

/**
 * Test 4: Geometric Product Precision
 * Tests precision in fundamental geometric algebra operations
 */
function test4_geometricProduct() {
  console.log('TEST 4: Geometric Product Precision');
  console.log('─────────────────────────────────────────────────────────');
  
  // Create two multivectors with small components
  const values1 = [1e-7, 2e-7, 3e-7, 4e-7, 5e-7, 6e-7, 7e-7, 8e-7];
  const values2 = [8e-7, 7e-7, 6e-7, 5e-7, 4e-7, 3e-7, 2e-7, 1e-7];
  
  // Float32Array
  const Alg32 = Algebra(3);
  const a32 = new Alg32(values1);
  const b32 = new Alg32(values2);
  const product32 = a32.Mul(b32);
  
  // Float64Array
  const Alg64 = Algebra({p:3, baseType: Float64Array});
  const a64 = new Alg64(values1);
  const b64 = new Alg64(values2);
  const product64 = a64.Mul(b64);
  
  // Compare scalar parts (they should be the same mathematically)
  const diff = Math.abs(product32[0] - product64[0]);
  const relDiff = diff / Math.abs(product64[0]);
  
  console.log(`  Configuration: Geometric product of small multivectors`);
  console.log(`  Float32Array scalar: ${product32[0].toExponential(10)}`);
  console.log(`  Float64Array scalar: ${product64[0].toExponential(10)}`);
  console.log(`  Relative difference: ${relDiff.toExponential(3)}`);
  console.log(`  ✓ Float64Array provides more consistent results\n`);
}

/**
 * Usage Examples
 */
function showUsageExamples() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Usage Examples');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('// Default: Float32Array (single precision)');
  console.log('const PGA = Algebra(3, 0, 1);');
  console.log('const point = new PGA();');
  console.log('// point is instanceof Float32Array\n');
  
  console.log('// Enhanced: Float64Array (double precision)');
  console.log('const PGA64 = Algebra({p:3, r:1, baseType: Float64Array});');
  console.log('const point64 = new PGA64();');
  console.log('// point64 is instanceof Float64Array\n');
  
  console.log('// All operations work identically:');
  console.log('const a = new PGA64([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);');
  console.log('const b = new PGA64([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);');
  console.log('const sum = a.Add(b);         // Addition');
  console.log('const product = a.Mul(b);     // Geometric product');
  console.log('const wedge = a.Wedge(b);     // Outer product');
  console.log('const inverse = a.Inverse;    // Inverse\n');
}

/**
 * Recommendations
 */
function showRecommendations() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Recommendations');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('✓ Use Float64Array (double precision) for:');
  console.log('  • Scientific computing and simulations');
  console.log('  • Iterative algorithms (physics, optimization)');
  console.log('  • High-dimensional geometric algebra operations');
  console.log('  • Applications where numerical stability is critical\n');
  
  console.log('✓ Use Float32Array (single precision) for:');
  console.log('  • Graphics and visualization (WebGL standard)');
  console.log('  • Memory-constrained environments (half the memory)');
  console.log('  • Applications with moderate precision requirements\n');
  
  console.log('Note: The baseType option only applies to flat algebras (≤6D).');
  console.log('      Graded algebras (>6D) automatically use Array.\n');
}

// Run all tests
try {
  test1_iterativeAccumulation();
  test2_highPrecisionScalars();
  test3_inverseAccuracy();
  test4_geometricProduct();
  showUsageExamples();
  showRecommendations();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  All tests completed successfully! ✓');
  console.log('═══════════════════════════════════════════════════════════\n');
  
} catch (error) {
  console.error('Error running tests:', error);
  process.exit(1);
}
