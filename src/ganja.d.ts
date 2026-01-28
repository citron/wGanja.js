/** 
 * Ganja.js TypeScript Type Definitions
 * Geometric Algebra - Not Just Algebra
 * @author Enki
 * @link https://github.com/enkimute/ganja.js
 */

/**
 * Options for configuring a Geometric Algebra
 */
export interface AlgebraOptions {
  /** Number of positive metric dimensions */
  p?: number;
  /** Number of negative metric dimensions */
  q?: number;
  /** Number of zero metric dimensions */
  r?: number;
  /** Custom metric array (e.g., [1,1,1,-1] for spacetime) */
  metric?: number[];
  /** Custom basis names (e.g., ['1','e1','e2','e12']) */
  basis?: string[];
  /** Custom Cayley table for multiplication */
  Cayley?: string[][];
  /** Allow mixing of various algebras */
  mix?: boolean;
  /** Use graded algebra implementation */
  graded?: boolean;
  /** Base type for internal storage (default: Float32Array) */
  baseType?: any;
  /** Create a dual number algebra */
  dual?: number;
  /** Use only even-grade elements */
  even?: boolean;
  /** Total number of dimensions */
  tot?: number;
  /** Algebra over another algebra */
  over?: any;
  /** Grade array */
  grades?: number[];
}

/**
 * A multivector element in a Geometric Algebra
 */
export interface Element extends Float32Array {
  // ===== Grade Operations =====
  
  /**
   * Extract a specific grade from the multivector
   * @param grade The grade to extract
   * @param res Optional result element
   * @returns The grade-selected element
   */
  Grade(grade: number, res?: Element): Element;
  
  /**
   * Extract only even grades
   * @param res Optional result element
   * @returns Element with only even grades
   */
  Even(res?: Element): Element;
  
  /**
   * Create a multivector from a specific grade
   * @param grade The grade to create
   * @param args Coefficients for that grade
   */
  nVector(grade: number, ...args: number[]): this;
  
  /**
   * Fill in coefficients (index, value pairs)
   * @param args Alternating index and value arguments
   */
  Coeff(...args: any[]): this;
  
  /**
   * Negate specific grades
   * @param res Result element
   * @param a Grades to negate
   */
  Map(res: Element, ...a: number[]): Element;

  // ===== Properties =====
  
  /** Vector grade only */
  readonly Vector: Float32Array;
  
  /** Negation of all components */
  readonly Negative: Element;
  
  /** Reverse the order of basis blades */
  readonly Reverse: Element;
  
  /** Main involution */
  readonly Involute: Element;
  
  /** Clifford conjugation */
  readonly Conjugate: Element;
  
  /** Poincaré duality operator */
  readonly Dual: Element;
  
  /** Inverse of dual operator */
  readonly UnDual: Element;
  
  /** Metric-dependent length */
  readonly Length: number;
  
  /** Non-metric (Euclidean) length */
  readonly VLength: number;
  
  /** Normalized multivector */
  readonly Normalized: Element;
  
  /** Multiplicative inverse */
  readonly Inverse: Element;

  // ===== Binary Operations =====
  
  /**
   * Multivector addition
   * @param b Element to add
   * @param res Optional result element
   */
  Add(b: Element, res?: Element): Element;
  
  /**
   * Multivector subtraction
   * @param b Element to subtract
   * @param res Optional result element
   */
  Sub(b: Element, res?: Element): Element;
  
  /**
   * Geometric product
   * @param b Element to multiply
   * @param res Optional result element
   */
  Mul(b: Element, res?: Element): Element;
  
  /**
   * Scalar multiplication
   * @param b Scalar value
   * @param res Optional result element
   */
  Scale(b: number, res?: Element): Element;
  
  /**
   * Left contraction (inner product)
   * @param b Element
   * @param res Optional result element
   */
  LDot(b: Element, res?: Element): Element;
  
  /**
   * Inner product (symmetric)
   * @param b Element
   * @param res Optional result element
   */
  Dot(b: Element, res?: Element): Element;
  
  /**
   * Outer (wedge) product - MEET
   * @param b Element
   * @param res Optional result element
   */
  Wedge(b: Element, res?: Element): Element;
  
  /**
   * Regressive (vee) product - JOIN
   * @param b Element
   * @param res Optional result element
   */
  Vee(b: Element, res?: Element): Element;
  
  /**
   * Division
   * @param b Element to divide by
   */
  Div(b: Element): Element;

  // ===== Utilities =====
  
  /**
   * String representation of the multivector
   */
  toString(): string;
  
  /**
   * Compute eigenvalues of a matrix
   */
  eigenValues?: (A: number[][], iter?: number) => number[];
  
  /** Scalar component accessor */
  s?: number;
  
  /** Basis blade accessors (e1, e2, e12, etc.) */
  [key: string]: any;
}

/**
 * Geometric Algebra class constructor
 */
export interface AlgebraClass {
  /**
   * Create a new multivector element
   * @param coeffs Optional coefficients array
   */
  new(coeffs?: number[] | ArrayLike<number>): Element;
  
  /**
   * Create a scalar element
   * @param value The scalar value
   */
  Scalar(value: number): Element;
  
  /**
   * Create a vector element
   * @param args Vector components
   */
  Vector(...args: number[]): Element;
  
  /**
   * Transform a function to use operator overloading and algebraic literals
   * @param f Function using algebraic syntax (e.g., 1e1*2e2)
   * @returns The transformed function
   */
  inline<T extends Function>(f: T): T;
  
  /**
   * Get a description of the algebra
   */
  describe(): AlgebraDescription;
  
  /**
   * Graph elements or functions
   * @param func Function or elements to graph
   * @param options Graphing options
   */
  graph(func: Function | Element[] | Element, options?: GraphOptions): any;
  
  /**
   * Automatic differentiation operator
   */
  D?: (func: Function) => Function;
  
  /**
   * Transpose automatic differentiation operator
   */
  Dt?: (func: Function) => Function;
  
  /**
   * QR decomposition helper
   */
  QR?: (M: number[][]) => [number[][], number[][]];
  
  /**
   * Create an arrow for visualization
   */
  arrow?: (from: Element, to: Element, width?: number, aspect?: number, camera?: number) => Element[];
}

/**
 * Description of a Geometric Algebra
 */
export interface AlgebraDescription {
  /** Basis blade names */
  basis: string[];
  /** Metric signature */
  metric: (number | string)[];
  /** Number of positive dimensions */
  p: number;
  /** Number of negative dimensions */
  q: number;
  /** Number of zero dimensions */
  r: number;
}

/**
 * Options for graphing
 */
export interface GraphOptions {
  /** Canvas or element to render to */
  canvas?: HTMLCanvasElement | SVGElement;
  /** Width of rendering */
  width?: number;
  /** Height of rendering */
  height?: number;
  /** Camera position */
  camera?: Element;
  /** Grid options */
  grid?: boolean | number;
  /** Point size */
  pointSize?: number;
  /** Line width */
  lineWidth?: number;
  /** Animate the graph */
  animate?: boolean;
  /** Animation frame rate */
  fps?: number;
  /** Graph scale */
  scale?: number;
  /** Conformal mode */
  conformal?: boolean;
  /** Rendering mode: 'webgl' | 'svg' */
  mode?: string;
}

/**
 * Main Algebra generator function with multiple calling signatures
 */
export interface AlgebraFunction {
  /**
   * Create an algebra with no dimensions (reals)
   * @param func Optional function for inline syntax
   */
  (func?: Function): any;
  
  /**
   * Create an algebra with p positive dimensions
   * @param p Number of positive dimensions
   * @param func Optional function for inline syntax
   */
  (p: number, func?: Function): AlgebraClass;
  
  /**
   * Create an algebra with p positive and q negative dimensions
   * @param p Number of positive dimensions
   * @param q Number of negative dimensions
   * @param func Optional function for inline syntax
   */
  (p: number, q: number, func?: Function): AlgebraClass;
  
  /**
   * Create an algebra with p positive, q negative, and r zero dimensions
   * @param p Number of positive dimensions
   * @param q Number of negative dimensions
   * @param r Number of zero dimensions
   * @param func Optional function for inline syntax
   */
  (p: number, q: number, r: number, func?: Function): AlgebraClass;
  
  /**
   * Create an algebra with custom options
   * @param options Algebra configuration options
   * @param func Optional function for inline syntax
   */
  (options: AlgebraOptions, func?: Function): AlgebraClass;
}

/**
 * The main Algebra export
 */
declare const Algebra: AlgebraFunction;
export default Algebra;
