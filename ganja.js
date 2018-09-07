/** Ganja.js - Geometric Algebra - Not Just Algebra. 
  * @author Enki
  * @link   https://github.com/enkimute/ganja.js
  */

/*********************************************************************************************************************/
// 
// Ganja.js is an Algebra generator for javascript. It generates a wide variety of Algebra's and supports operator
// overloading, algebraic literals and a variety of graphing options.
//
// Ganja.js is designed with prototyping and educational purposes in mind. Clean mathematical syntax is the primary
// target.
//
// Ganja.js exports only one function called *Algebra*. This function is used to generate Algebra classes. (say complex
// numbers, minkowski or 3D CGA). The returned class can be used to create, add, multiply etc, but also to upgrade
// javascript functions with algebraic literals, operator overloading, vectors, matrices and much more.
//
// As a simple example, multiplying two complex numbers 3+2i and 1+4i could be done like this :
//
//  var complex = Algebra(0,1);
//  var a = new complex([3,2]);
//  var b = new complex([1,3]); 
//  var result = a.Mul(b);
// 
// But the same can be written using operator overloading and algebraic literals. (where scientific notation with
// lowercase e is overloaded to directly specify generators (e1, e2, e12, ...))
//
//   var result = Algebra(0,1,()=>(3+2e1)*(1+4e1));
//
// Please see github for user documentation and examples. 
//
/*********************************************************************************************************************/

// Documentation below is for implementors. I'll assume you know about Clifford Algebra's, grades, its products, etc ..
// I'll also assume you are familiar with ES6. My style may feel a bith mathematical, advise is to read slow. 

(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(name, definition);
  else context[name] = definition();
}('Algebra', this, function () {

/** The Algebra class generator. Possible calling signatures : 
  *   Algebra([func])                      => algebra with no dimensions, i.e. R. Optional function for the translator.
  *   Algebra(p,[func])                    => 'p' positive dimensions and an optional function to pass to the translator.
  *   Algebra(p,q,[func])                  => 'p' positive and 'q' negative dimensions and optional function.
  *   Algebra(p,q,r,[func])                => 'p' positive, 'q' negative and 'r' zero dimensions and optional function.
  *   Algebra({                            => for custom basis, cayley, mixing, etc pass in an object as first parameter.
  *     [p:p],                             => optional 'p' for # of positive dimensions
  *     [q:q],                             => optional 'q' for # of negative dimensions
  *     [r:r],                             => optional 'r' for # of zero dimensions
  *     [metric:array],                    => alternative for p,q,r. e.g. ([1,1,1,-1] for spacetime)
  *     [basis:array],                     => array of strings with basis names. (e.g. ['1','e1','e2','e12'])
  *     [Cayley:Cayley],                   => optional custom Cayley table (strings). (e.g. [['1','e1'],['e1','-1']])                            
  *     [mix:boolean],                     => Allows mixing of various algebras. (for space efficiency).
  *     [baseType:Float32Array]            => optional basetype to use.
  *   },[func])                            => optional function for the translator.
 **/  
  return function Algebra(p,q,r) {
  // Resolve possible calling signatures so we know the numbers for p,q,r. Last argument can always be a function.
    var fu=arguments[arguments.length-1],options=p; if (options instanceof Object) {
      q = (p.q || (p.metric && p.metric.filter(x=>x==-1).length))| 0;
      r = (p.r || (p.metric && p.metric.filter(x=>x==0).length)) | 0;
      p = p.p === undefined ? (p.metric && p.metric.filter(x=>x==1).length) : p.p || 0;
    } else { options={}; p=p|0; r=r|0; q=q|0; };

  // Calculate the total number of dimensions.
    var tot = (options.tot||(p||0)+(q||0)+(r||0)||(options.basis&&options.basis.length))|0;
 
  // Unless specified, generate a full set of Clifford basis names. We generate them as an array of strings by starting
  // from numbers in binary representation and changing the set bits into their relative position.  
  // Basis names are ordered first per grade, then lexically (not cyclic!). 
    var basis=options.basis||[...Array(2**tot)]                                                                               // => [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]
              .map((x,xi)=>(((1<<30)+xi).toString(2)).slice(-tot||-1)                                                         // => ["000", "001", "010", "011", "100", "101", "110", "111"]  (index of array in base 2)
              .replace(/./g,(a,ai)=>a=='0'?'':ai+1-(r==0?0:1)))                                                               // => ["", "3", "2", "23", "1", "13", "12", "123"] (1 bits replaced with their positions, 0's removed)
              .sort((a,b)=>(a.toString().length==b.toString().length)?(a|0)-(b|0):a.toString().length-b.toString().length)    // => ["", "1", "2", "3", "12", "13", "23", "123"] (sorted numerically)
              .map(x=>x&&'e'+x||'1');                                                                                         // => ["1", "e1", "e2", "e3", "e12", "e13", "e23", "e123"] (converted to commonly used basis names)
              
  // See if the basis names start from 0 or 1, store grade per component and lowest component per grade.             
    var low=basis.join('').split('').filter(x=>x.match(/\d/)).sort()[0]*1,
        grades=basis.map(x=>x.length-1),
        grade_start=grades.map((a,b,c)=>c[b-1]!=a?b:-1).filter(x=>x+1).concat([basis.length]);
        
  // String-simplify a concatenation of two basis blades. (and supports custom basis names e.g. e21 instead of e12)      
  // This is the function that implements e1e1 = +1/-1/0 and e1e2=-e2e1. The brm function creates the remap dictionary.
    var simplify = (s,p,q,r)=>{
          var sign=1,c,l,t=[],f=true;s=[...s.replace(/e/g,'')];l=s.length;
          while (f) { f=false;
          // implement Ex*Ex = metric.
            for (var i=0; i<l;) if (s[i]===s[i+1]) { if ((s[i]-low)>=(p+r)) sign*=-1; else if ((s[i]-low)<r) sign=0; i+=2; f=true; } else t.push(s[i++]);
          // implement Ex*Ey = Ey*Ex while sorting basis vectors.  
            for (var i=0; i<t.length-1; i++) if (t[i]>t[i+1]) { c=t[i];t[i]=t[i+1];t[i+1]=c;sign*=-1;f=true; break;} if (f) { s=t;t=[];l=s.length; }
          }
          var ret=(sign==0)?'0':((sign==1)?'':'-')+(t.length?'e'+t.join(''):'1'); return (brm&&brm[ret])||(brm&&brm['-'+ret]&&'-'+brm['-'+ret])||ret;
        },
        brm=(x=>{ var ret={}; for (var i in basis) ret[basis[i]=='1'?'1':simplify(basis[i],p,q,r)] = basis[i]; return ret; })(basis);
        
  // Faster and degenerate-metric-resistant dualization. (a remapping table that maps items into their duals).         
    var drm=basis.map((a,i)=>{ return {a:a,i:i} })
                 .sort((a,b)=>a.a.length>b.a.length?1:a.a.length<b.a.length?-1:(+a.a.slice(1).split('').sort().join(''))-(+b.a.slice(1).split('').sort().join('')) )
                 .map(x=>x.i)
                 .reverse()
    var drms=drm.map((x,i)=>(x==0||i==0)?1:simplify(basis[x]+basis[i])[0]=='-'?-1:1);
    
  // Generate multiplication tables for the outer and geometric products.  
    var mulTable   = options.Cayley||basis.map(x=>basis.map(y=>(x==1)?y:(y==1)?x:simplify(x+y,p,q,r))),              // for the gp, with metric.
        mulTable2  = options.Cayley||basis.map(x=>basis.map(y=>(x==1)?y:(y==1)?x:simplify(x+y,p+q+r,0,0))),          // for the op, without metric.
        mulTableb  = mulTable.map(x=>x.map(y=>y.replace(/^-/,'')));
        mulTable2b = mulTable2.map(x=>x.map(y=>y.replace(/^-/,'')));
   
  // Store the full metric (also for bivectors etc .. diagonal of Cayley)         
    var metric = basis.map((x,xi)=>mulTable[xi][xi]|0);
 
  // Convert Caeyley table to product matrices. The outer product selects the strict sum of the GP (but without metric), the inner product
  // is the left contraction.           
    var gp=basis.map(x=>basis.map(x=>'0')), cp=gp.map(x=>gp.map(x=>'0')), op=gp.map(x=>gp.map(x=>'0')), gpo={}, opo={};          // Storage for our product tables.
    basis.forEach((x,xi)=>basis.forEach((y,yi)=>{
      var n  = mulTable[xi][yi].replace(/^-/,''); if (n==0) n = mulTable2[xi][yi].replace(/^-/,''); if (!gpo[n]) gpo[n]=[]; gpo[n].push([xi,yi]);
      var n2 = mulTable2[xi][yi].replace(/^-/,''); if (!opo[n2]) opo[n2]=[]; opo[n2].push([xi,yi]);
    }));
    basis.forEach((o,oi)=>{
      opo[o].forEach(([xi,yi])=>op[oi][xi]=(grades[oi]==grades[xi]+grades[yi])?((mulTable2[xi][yi]=='0')?'0':((mulTable2[xi][yi][0]!='-')?'':'-')+'b['+yi+']*this['+xi+']'):'0');
      gpo[o].forEach(([xi,yi])=>{
        gp[oi][xi]=(mulTable[xi][yi]=='0')?'0':((mulTable[xi][yi][0]!='-')?'':'-')+'b['+yi+']*this['+xi+']';
        cp[oi][xi]=(grades[oi]==grades[yi]-grades[xi])?gp[oi][xi]:'0'; 
      });
    });
    
  // Generate a new class for our algebra. It extends the javascript typed arrays (default float32 but can be specified in options).
    var res = class Element extends (options.baseType||Float32Array) {
    
    // constructor - create a floating point array with the correct number of coefficients.
      constructor(a) { super(a||basis.length); return this; }
      
    // grade selection - return a only the part of the input with the specified grade.  
      Blade(grade,res) { var res=res||new Element(); for (var i=0,l=res.length; i<l; i++) if (grades[i]==grade) res[i]=this[i]; else res[i]=0; return res; }
      
    // Right and Left divide - Defined on the elements, shortcuts to multiplying with the inverse.  
      Div  (b,res) { return this.Mul(b.Inverse,res); }
      LDiv (b,res) { return b.Inverse.Mul(this,res); }
    
    // Taylor exp - I will replace this with something smarter for elements of the even subalgebra's and other pure blades.  
      Exp  ()      { var r = Element.Scalar(1), y=1, M= new Element(this), N=new Element(this); for (var x=1; x<25; x++) { r=r.Add(M.Mul(Element.Scalar(1/y))); M=M.Mul(N); y=y*(x+1); }; return r; }
      
    // Helper for efficient inverses and a helper to return the grade-1 part of a multivector as a trimmed typed array.   
      Map  (a,b  ) { var res = new this.constructor(); for (var i=0; i<this.length; i++) res[i]= this[i]*(((a===grades[i])||(b===grades[i]))?-1:1); return res; }
      get Vector ()    { return this.slice(grade_start[1],grade_start[2]); };
      
    // Factories - Make it easy to generate vectors, bivectors, etc when using the functional API. None of the examples use this but
    // users that have used other GA libraries will expect these calls. The Coeff() is used internally when translating algebraic literals.
      static Element()   { var res = new Element(); for (var i=0; i<res.length; i++) res[i]=arguments[i]||0; return res; }
      static Coeff()     { var res = new Element(), i=0; while(i<arguments.length) res[arguments[i++]]=arguments[i++]; return res; }
      static Scalar(x)   { var res = new Element(); res[0]=x; return res; }
      static Vector()    { var res = new Element(); res.set(arguments,grade_start[1]); return res; }
      static Bivector()  { var res = new Element(); res.set(arguments,grade_start[2]); return res; }
      static Trivector() { var res = new Element(); res.set(arguments,grade_start[3]); return res; }
      static nVector(n)  { var res = new Element(); res.set([].slice.call(arguments,1),grade_start[n]); return res; }
    
    // Static operators. The parser will always translate operators to these static calls so that scalars, vectors, matrices and other non-multivectors can also be handled.
    // The static operators typically handle functions and matrices, calling through to element methods for multivectors. They are intended to be flexible and allow as many
    // types of arguments as possible. If performance is a consideration, one should use the generated element methods instead. (which only accept multivector arguments)
      static toEl(x)        { if (x instanceof Function) x=x(); if (!(x instanceof Element)) x=Element.Scalar(x); return x; }
    
    // Addition and subtraction. Subtraction with only one parameter is negation.   
      static Add(a,b,res)   { 
      // Resolve expressions passed in.
        if(a.call)a=a(); if(b.call)b=b();
      // If only one is an array, add the other element to each of the elements.   
        if ((a instanceof Array)^(b instanceof Array)) return (a instanceof Array)?a.map(x=>Element.Add(x,b)):b.map(x=>Element.Add(a,x)); 
      // If both are equal length arrays, add elements one-by-one  
        if ((a instanceof Array)&&(b instanceof Array)&&a.length==b.length) return a.map((x,xi)=>Element.Add(x,b[xi])); 
      // If either is a string, the result is a string.  
        if ((typeof a=='string')||(typeof b=='string')) return a.toString()+b.toString(); 
      // If they're both not elements let javascript resolve it.  
        if (!(a instanceof Element || b instanceof Element)) return a+b; 
      // Here we're left with scalars and multivectors, call through to generated code.   
        a=Element.toEl(a); b=Element.toEl(b); return a.Add(b,res);
      }
      
      static Sub(a,b,res)   {  
      // Resolve expressions passed in.
        if(a.call)a=a(); b=(b&&b.call)?b():b; 
      // If only one is an array, add the other element to each of the elements.   
        if (b&&((a instanceof Array)^(b instanceof Array))) return (a instanceof Array)?a.map(x=>Element.Sub(x,b)):b.map(x=>Element.Sub(a,x)); 
      // If both are equal length arrays, add elements one-by-one  
        if (b&&(a instanceof Array)&&(b instanceof Array)&&a.length==b.length) return a.map((x,xi)=>Element.Sub(x,b[xi])); 
      // Negation  
        if (arguments.length==1) return Element.Mul(a,-1); 
      // If none are elements here, let js do it.  
        if (!(a instanceof Element || b instanceof Element)) return a-b; 
      // Here we're left with scalars and multivectors, call through to generated code.   
        a=Element.toEl(a); b=Element.toEl(b); return a.Sub(b,res);
      }
    
    // The geometric product. (or matrix*matrix, matrix*vector, vector*vector product if called with 1D and 2D arrays)
      static Mul(a,b,res)   {
      // Resolve expressions  
        if(a.call)a=a(); if(b.call)b=b(); 
      // Handle matrices and vectors.  
        if ((a instanceof Array)&&(b instanceof Array)) { 
        // vector times vector performs a dot product. (which internally uses the GP on each component)
          if(!(a[0] instanceof Array)&&!(b[0] instanceof Array)) { var r=tot?Element.Scalar(0):0; a.forEach((x,i)=>r=Element.Add(r,Element.Mul(x,b[i]))); return r; } 
        // Array times vector  
          if(!(b[0] instanceof Array)) return a.map((x,i)=>Element.Mul(a[i],b)); 
        // Array times Array  
          var r=a.map((x,i)=>b[0].map((y,j)=>{ var r=tot?Element.Scalar(0):0; x.forEach((xa,k)=>r=Element.Add(r,Element.Mul(xa,b[k][j]))); return r; })); 
        // Return resulting array or scalar if 1 by 1.   
          if (r.length==1 && r[0].length==1) return r[0][0]; else return r;  
        } 
      // Only one is an array multiply each of its elements with the other.  
        if ((a instanceof Array)^(b instanceof Array)) return (a instanceof Array)?a.map(x=>Element.Mul(x,b)):b.map(x=>Element.Mul(a,x)); 
      // Try js multiplication, else call through to geometric product.  
        var r=a*b; if (!isNaN(r)) return r; 
        a=Element.toEl(a); b=Element.toEl(b); return a.Mul(b,res);
      }  
      
    // The inner product. (default is left contraction).  
      static Dot(a,b,res)   {  
      // Expressions
        if(a.call)a=a(); if(b.call)b=b(); 
      // js if numbers, else contraction product.  
        if (!(a instanceof Element || b instanceof Element)) return a*b; 
        a=Element.toEl(a);b=Element.toEl(b); return a.Dot(b,res); 
      }  
      
    // The outer product. (Grassman product - no use of metric)  
      static Wedge(a,b,res) {  
      // Expressions
        if(a.call)a=a(); if(b.call)b=b(); 
      // js, else generated wedge product.
        if (!(a instanceof Element || b instanceof Element)) return a*b; 
        a=Element.toEl(a);b=Element.toEl(b); return a.Wedge(b,res); 
      }  
      
    // The regressive product. (Dual of the outer product of the duals). 
      static Vee(a,b,res) {  
      // Expressions
        if(a.call)a=a(); if(b.call)b=b(); 
      // js, else generated vee product. (shortcut for dual of wedge of duals)
        if (!(a instanceof Element || b instanceof Element)) return a*b; 
        a=Element.toEl(a);b=Element.toEl(b); return a.Vee(b,res); 
      }  
     
    // The sandwich product. Provided for convenience (>>> operator)  
      static sw(a,b) {  
      // Expressions
        if(a.call)a=a(); if(b.call)b=b(); 
      // Map elements in array  
        if (b instanceof Array) return b.map(x=>Element.sw(a,x)); 
      // Call through. no specific generated code for it so just perform the muls.  
        a=Element.toEl(a); b=Element.toEl(b); return a.Mul(b).Mul(a.Conjugate); 
      }

    // Division - scalars or cal through to element method.
      static Div(a,b,res) {  
      // Expressions
        if(a.call)a=a(); if(b.call)b=b(); 
      // js or call through to element divide.  
        if (!(a instanceof Element || b instanceof Element)) return a/b; 
        a=Element.toEl(a);b=Element.toEl(b); return a.Div(b,res); 
      }  
      
    // Pow - needs obvious extensions for natural powers. (exponentiation by squaring)  
      static Pow(a,b,res) {  
      // Expressions
        if(a.call)a=a(); if(b.call)b=b(); 
      // Squaring  
        if (b==2) return this.Mul(a,a,res);
      // No elements, call through to js  
        if (!(a instanceof Element || b instanceof Element)) return a**b; 
      // Inverse  
        if (b==-1) return a.Inverse;  
      // Exponentiation.  
        if (a==Math.E) return b.Exp(); 
      // Call through to element pow.  
        a=Element.toEl(a); return a.Pow(b); 
      }  
      
    // Handles scalars and calls through to element method.  
      static exp(a) {  
      // Expressions.
        if(a.call)a=a(); 
      // If it has an exp callthrough, use it, else call through to math.  
        if (a.Exp) return a.Exp(); 
        return Math.exp(a); 
      }
      
    // Dual, Involute, Reverse, Conjugate, Normalize and length, all direct call through. Conjugate handles matrices.
      static Dual(a)      { if (r) return Element.toEl(a).map((x,i,a)=>a[drm[i]]*drms[i]); return Element.toEl(a).Dual; }; 
      static Involute(a)  { return Element.toEl(a).Involute; }; 
      static Reverse(a)   { return Element.toEl(a).Reverse; }; 
      static Conjugate(a) { if (a instanceof Array) return a[0].map((c,ci)=>a.map((r,ri)=>Element.Conjugate(a[ri][ci]))); return Element.toEl(a).Conjugate; }
      static Normalize(a) { return Element.toEl(a).Normalized; }; 
      static Length(a)    { return Element.toEl(a).Length };
      
    // Comparison operators always use length. Handle expressions, then js or length comparison  
      static lt(a,b)  { if(a.call)a=a(); if(b.call)b=b(); return (a instanceof Element?a.Length:a)<(b instanceof Element?b.Length:b); }
      static gt(a,b)  { if(a.call)a=a(); if(b.call)b=b(); return (a instanceof Element?a.Length:a)>(b instanceof Element?b.Length:b); }
      static lte(a,b) { if(a.call)a=a(); if(b.call)b=b(); return (a instanceof Element?a.Length:a)<=(b instanceof Element?b.Length:b); }
      static gte(a,b) { if(a.call)a=a(); if(b.call)b=b(); return (a instanceof Element?a.Length:a)>=(b instanceof Element?b.Length:b); }
      
    // Debug output and printing multivectors.  
      static describe() { console.log(`Basis\n${basis}\nMetric\n${metric.slice(1,1+tot)}\nCayley\n${mulTable.map(x=>(x.map(x=>('           '+x).slice(-2-tot)))).join('\n')}\nMatrix Form:\n`+gp.map(x=>x.map(x=>x.match(/(-*b\[\d+\])/)).map(x=>x&&((x[1].match(/-/)||' ')+String.fromCharCode(65+1*x[1].match(/\d+/)))||' 0')).join('\n')); }    
      toString() { var res=[]; for (var i=0; i<basis.length; i++) if (Math.abs(this[i])>1e-10) res.push(((this[i]==1)&&i?'':((this[i]==-1)&&i)?'-':(this[i].toFixed(10)*1))+(i==0?'':tot==1&&q==1?'i':basis[i].replace('e','e_'))); return res.join('+').replace(/\+-/g,'-')||'0'; }
      
    // The graphing function supports several modes. It can render 1D functions and 2D functions on canvas, and PGA2D, PGA3D and CGA2D functions using SVG.
    // It handles animation and interactivity.
    //   graph(function(x))     => function of 1 parameter will be called with that parameter from -1 to 1 and graphed on a canvas. Returned values should also be in the [-1 1] range
    //   graph(function(x,y))   => functions of 2 parameters will be called from -1 to 1 on both arguments. Returned values can be 0-1 for greyscale or an array of three RGB values.
    //   graph(array)           => array of algebraic elements (points, lines, circles, segments, texts, colors, ..) is graphed.
    //   graph(function=>array) => same as above, for animation scenario's this function is called each frame.
    // An optional second parameter is an options object { width, height, animate, camera, scale, grid, canvas } 
      static graph(f,options) { 
      // Store the original input
        if (!f) return; var origf=f; 
      // generate default options.  
        options=options||{}; options.scale=options.scale||1; options.camera=options.camera||new Element([0.7071067690849304, 0, 0, 0, 0, 0, 0, 0, 0, 0.7071067690849304, 0, 0, 0, 0, 0, 0]); 
        var ww=options.width, hh=options.height, cvs=options.canvas, tpcam=new Element([0,0,0,0,0,0,0,0,0,0,0,-5,0,0,1,0]),tpy=this.Coeff(4,1),tp=new Element(), 
      // project 3D to 2D. This allows to render 3D and 2D PGA with the same code.    
        project=(o)=>{ if (!o) return o; while (o.call) o=o(); return (tot==4 && (o.length==16))?(tpcam).Vee(options.camera.Mul(o).Mul(options.camera.Conjugate)).Wedge(tpy):o};
      // gl escape.
        if (options.gl) return Element.graphGL(f,options);  
      // if we get an array or function without parameters, we render c2d or p2d SVG points/lines/circles/etc
        if (!(f instanceof Function) || f.length===0) { 
        // Our current cursor, color, animation state and 2D mapping.
          var lx,ly,lr,color,res,anim=false,to2d=(tot==3)?[0,1,2,3,4,5,6,7]:[0,7,9,10,13,12,14,15];
        // Make sure we have an array of elements. (if its an object, convert to array with elements and names.)   
          if (f instanceof Function) f=f(); if (!(f instanceof Array)) f=[].concat.apply([],Object.keys(f).map((k)=>typeof f[k]=='number'?[f[k]]:[f[k],k])); 
        // The build function generates the actual SVG. It will be called everytime the user interacts or the anim flag is set.  
          function build(f,or) {
          // Make sure we have an aray. 
            if (or && f && f instanceof Function) f=f(); 
          // Reset position and color for cursor.  
            lx=-2;ly=-1.85;lr=0;color='#444'; 
          // Create the svg element. (master template string till end of function)  
            var svg=new DOMParser().parseFromString(`<SVG onmousedown="if(evt.target==this)this.sel=undefined" viewBox="-2 -${2*(hh/ww||1)} 4 ${4*(hh/ww||1)}" style="width:${ww||512}px; height:${hh||512}px; background-color:#eee; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; user-select:none">
            // Add a grid (option)
            ${options.grid?[...Array(11)].map((x,xi)=>`<line x1="-10" y1="${(xi-5)/2}" x2="10" y2="${(xi-5)/2}" stroke-width="0.005" stroke="#CCC"/><line y1="-10" x1="${(xi-5)/2}" y2="10" x2="${(xi-5)/2}"  stroke-width="0.005" stroke="#CCC"/>`):''}
            // Handle conformal 2D elements. 
            ${options.conformal?f.map&&f.map((o,oidx)=>{ 
            // Optional animation handling.
              if((o==Element.graph && or!==false)||(oidx==0&&options.animate&&or!==false)) { anim=true; requestAnimationFrame(()=>{var r=build(origf,(!res)||(document.body.contains(res))).innerHTML; if (res) res.innerHTML=r; }); if (!options.animate) return; }
            // Resolve expressions passed in.  
              while (o.call) o=o();
            // Arrays are rendered as segments or polygons. (2 or more elements)  
              if (o instanceof Array)  { lx=ly=lr=0; o=o.map(o=>{ while(o.call)o=o(); return o; }); o.forEach((o)=>{lx+=o.e1;ly+=-o.e2});lx/=o.length;ly/=o.length; return o.length>2?`<POLYGON STYLE="pointer-events:none; fill:${color};opacity:0.7" points="${o.map(o=>(o.e1+','+(-o.e2)+' '))}"/>`:`<LINE style="pointer-events:none" x1=${o[0].e1} y1=${-o[0].e2} x2=${o[1].e1} y2=${-o[1].e2} stroke-width="0.005" stroke="${color||'#888'}"/>`; }
            // Strings are rendered at the current cursor position.  
              if (typeof o =='string') { var res2=(o[0]=='_')?'':`<text x="${lx}" y="${ly}" font-family="Verdana" font-size="0.1" style="pointer-events:none" fill="${color||'#333'}" transform="rotate(${lr},${lx},${ly})">&nbsp;${o}&nbsp;</text>`; ly+=0.14; return res2; }
            // Numbers change the current color.  
              if (typeof o =='number') { color='#'+(o+(1<<25)).toString(16).slice(-6); return ''; };
            // All other elements are rendered ..  
              var b1=o.Blade(1).VLength>0.001,b2=o.Blade(2).VLength>0.001,b3=o.Blade(3).VLength>0.001; 
            // Points  
              if (b1 && !b2 && !b3) { lx=o.e1; ly=-o.e2; lr=0; return res2=`<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="0.03" fill="${color||'green'}"/>`; }
              else if (!b1 && !b2 && b3) { var isLine=Element.Coeff(4,1,3,-1).Dot(o).Length==0; 
              // Lines.
                if (isLine) { var loc=((Element.Coeff(4,-.5).Add(Element.Coeff(3,-.5))).Dot(o)).Div(o), att=(Element.Coeff(4,1,3,-1)).Dot(o); lx=-loc.e1; ly=loc.e2; lr=Math.atan2(att[8],att[7])/Math.PI*180; return `<LINE style="pointer-events:none" x1=${lx-10} y1=${ly} x2=${lx+10} y2=${ly} stroke-width="0.005" stroke="${color||'#888'}" transform="rotate(${lr},${lx},${ly})"/>`;};
              // Circles.  
                var loc=o.Div((Element.Coeff(4,1,3,-1)).Dot(o)); lx=-loc.e1; ly=loc.e2; var r=-o.Mul(o.Conjugate).s/(Element.Pow((Element.Coeff(4,1,3,-1)).Dot(o),2).s); r=r**0.5; return `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="${r}" stroke-width="0.005" fill="none" stroke="${color||'green'}"/>`;   
              } else if (!b1 && b2 &&!b3) { 
              // Point Pairs.
                lr=0; var ei=Element.Coeff(4,1,3,-1),eo=Element.Coeff(4,.5,3,.5), nix=o.Wedge(ei), sqr=o.Dot(o).s/nix.Dot(nix).s, r=Math.sqrt(Math.abs(sqr)), attitude=((ei.Wedge(eo)).Dot(nix)).Normalized.Mul(Element.Scalar(r)), pos=o.Div(nix); pos=pos.Div( pos.Dot(Element.Sub(ei))); 
                lx=pos.e1; ly=-pos.e2; if (sqr<0) return `<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="0.03" stroke-width="0.005" fill="none" stroke="${color||'green'}"/>`;
                lx=pos.e1+attitude.e1; ly=-pos.e2-attitude.e2; var res2=`<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="0.03" fill="${color||'green'}"/>`;
                lx=pos.e1-attitude.e1; ly=-pos.e2+attitude.e2; return res2+`<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="0.03" fill="${color||'green'}"/>`;
              }
            // Handle projective 2D and 3D elements.  
            }):f.map&&f.map((o,oidx)=>{  if((o==Element.graph && or!==false)||(oidx==0&&options.animate&&or!==false)) { anim=true; requestAnimationFrame(()=>{var r=build(origf,(!res)||(document.body.contains(res))).innerHTML; if (res) res.innerHTML=r; }); if (!options.animate) return; } while (o instanceof Function) o=o(); o=(o instanceof Array)?o.map(project):project(o); if (o===undefined) return; 
            // line segments and polygons
              if (o instanceof Array)  { lx=ly=lr=0; o.forEach((o)=>{o=(o.call)?o():o; lx+=((drm[1]==6||drm[1]==14)?-1:1)*o[drm[2]]/o[drm[1]];ly+=o[drm[3]]/o[drm[1]]});lx/=o.length;ly/=o.length; return o.length>2?`<POLYGON STYLE="pointer-events:none; fill:${color};opacity:0.7" points="${o.map(o=>((drm[1]==6||drm[1]==14)?-1:1)*o[drm[2]]/o[drm[1]]+','+o[drm[3]]/o[drm[1]]+' ')}"/>`:`<LINE style="pointer-events:none" x1=${((drm[1]==6||drm[1]==14)?-1:1)*o[0][drm[2]]/o[0][drm[1]]} y1=${o[0][drm[3]]/o[0][drm[1]]} x2=${((drm[1]==6||drm[1]==14)?-1:1)*o[1][drm[2]]/o[1][drm[1]]} y2=${o[1][drm[3]]/o[1][drm[1]]} stroke-width="0.005" stroke="${color||'#888'}"/>`; }
            // Labels  
              if (typeof o =='string') { var res2=(o[0]=='_')?'':`<text x="${lx}" y="${ly}" font-family="Verdana" font-size="0.1" style="pointer-events:none" fill="${color||'#333'}" transform="rotate(${lr},0,0)">&nbsp;${o}&nbsp;</text>`; ly+=0.14; return res2; }
            // Colors  
              if (typeof o =='number') { color='#'+(o+(1<<25)).toString(16).slice(-6); return ''; };
            // Points  
              if (o[to2d[6]]**2        >0.0001) { lx=options.scale*o[drm[2]]/o[drm[1]]; if (drm[1]==6||drm[1]==14) lx*=-1; ly=options.scale*o[drm[3]]/o[drm[1]]; lr=0;  var res2=`<CIRCLE onmousedown="this.parentElement.sel=${oidx}" cx="${lx}" cy="${ly}" r="0.03" fill="${color||'green'}"/>`; ly-=0.05; lx-=0.1; return res2; }
            // Lines  
              if (o[to2d[2]]**2+o[to2d[3]]**2>0.0001) { var l=Math.sqrt(o[to2d[2]]**2+o[to2d[3]]**2); o[to2d[2]]/=l; o[to2d[3]]/=l; o[to2d[1]]/=l; lx=0.5; ly=((drm[1]==6)?-1:-1)*o[to2d[1]]; lr=-Math.atan2(o[to2d[2]],o[to2d[3]])/Math.PI*180; var res2=`<LINE style="pointer-events:none" x1=-10 y1=${ly} x2=10 y2=${ly} stroke-width="0.005" stroke="${color||'#888'}" transform="rotate(${lr},0,0)"/>`; ly-=0.05; return res2; }
            // Vectors   
              if (o[to2d[4]]**2+o[to2d[5]]**2>0.0001) { lr=0; ly+=0.05; lx+=0.1; var res2=`<LINE style="pointer-events:none" x1=${lx} y1=${ly} x2=${lx-o.e02} y2=${ly+o.e01} stroke-width="0.005" stroke="${color||'#888'}"/>`; ly=ly+o.e01/4*3-0.05; lx=lx-o.e02/4*3; return res2; }
            }).join()}`,'text/html').body; 
          // return the inside of the created svg element.  
            return svg.removeChild(svg.firstChild); 
          };
        // Create the initial svg and install the mousehandlers.  
          res=build(f); res.value=f;
          res.onmousemove=(e)=>{ if (res.sel===undefined || !e.buttons) return;var x=(e.clientX-res.getBoundingClientRect().left)/(res.getBoundingClientRect().width/4||128)-2,y=((e.clientY-res.getBoundingClientRect().top)/(res.getBoundingClientRect().height/4||128)-2)*(res.getBoundingClientRect().height/res.getBoundingClientRect().width||1); if (options.conformal) {f[res.sel][1]=x; f[res.sel][2]=-y; var l=x*x+y*y; f[res.sel][3]=0.5-l*0.5; f[res.sel][4]=0.5+l*0.5; } else {f[res.sel][drm[2]]=(drm[1]==6)?-x:x; f[res.sel][drm[3]]=y; f[res.sel][drm[1]]=1;} if (!anim) res.innerHTML=build(f).innerHTML; res.dispatchEvent(new CustomEvent('input')) }; 
          return res;
        }  
      // 1d and 2d functions are rendered on a canvas.   
        cvs=cvs||document.createElement('canvas'); if(ww)cvs.width=ww; if(hh)cvs.height=hh; var w=cvs.width,h=cvs.height,context=cvs.getContext('2d'), data=context.getImageData(0,0,w,h);
      // two parameter functions .. evaluate for both and set resulting color.  
        if (f.length==2) for (var px=0; px<w; px++) for (var py=0; py<h; py++) { var res=f(px/w*2-1, py/h*2-1); res=res.buffer?[].slice.call(res):res.slice?res:[res,res,res]; data.data.set(res.map(x=>x*255).concat([255]),py*w*4+px*4); }
      // one parameter function.. go over x range, use result as y.   
        else if (f.length==1) for (var px=0; px<w; px++) { var res=f(px/w*2-1); res=Math.round((res/2+0.5)*h); if (res > 0 && res < h-1) data.data.set([0,0,0,255],res*w*4+px*4); }
        return context.putImageData(data,0,0),cvs;       
      }
      
    // webGL2 Graphing function.
      static graphGL(f,options) {
      // Create a canvas, webgl2 context and set some default GL options.
        var canvas=document.createElement('canvas'); canvas.width=options.width||600; canvas.height=options.height||600; canvas.style.backgroundColor='#EEE';
        var gl=canvas.getContext('webgl2',{alpha:options.alpha||false,antialias:true,powerPreference:'high-performance'}); 
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); if (!options.alpha) gl.clearColor(240/255,240/255,240/255,1.0);
      // Compile vertex and fragment shader, return program.  
        var compile=(vs,fs)=>{ 
          var s=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((t,i)=>{
            var r=gl.createShader(t); gl.shaderSource(r,[vs,fs][i]); gl.compileShader(r);
            return gl.getShaderParameter(r, gl.COMPILE_STATUS)&&r||console.error(gl.getShaderInfoLog(r));
          });
          var p = gl.createProgram(); gl.attachShader(p, s[0]); gl.attachShader(p, s[1]); gl.linkProgram(p);
          gl.getProgramParameter(p, gl.LINK_STATUS)||console.error(gl.getProgramInfoLog(p));
          return p;
        };
      // Create vertex array and buffers, upload vertices and optionally texture coordinates.  
        var createVA=function(vtx, texc) {
              var r = gl.createVertexArray(); gl.bindVertexArray(r);
              var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); 
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vtx), gl.STATIC_DRAW);
              gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
              if (texc){
                var b2=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texc), gl.STATIC_DRAW);
                gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(1);
              }
              return {r,b,b2}
            },
      // Destroy Vertex array and delete buffers.
            destroyVA=function(va) {
              if (va.b) gl.deleteBuffer(va.b); if (va.b2) gl.deleteBuffer(va.b2); if (va.r) gl.deleteVertexArray(va.r);
            }
      // Default modelview matrix, convert camera to matrix (biquaternion->matrix)      
        var M=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,5,1], mtx = x=>{ var t=performance.now()/1000;
          if (tot==5) return [Math.cos(t),0,Math.sin(t),0,0,1,0,0,-Math.sin(t),0,Math.cos(t),0,0,0,5,1];
          x=x.Normalized; var y=x.Mul(x.Dual),X=-x.e23,Y=-x.e13,Z=x.e12,W=x.s,m=Array(16);
          var xx = X*X, xy = X*Y, xz = X*Z, xw = X*W, yy = Y*Y, yz = Y*Z, yw = Y*W, zz = Z*Z, zw = Z*W;
          return [ 1-2*(yy+zz), 2*(xy+zw), 2*(xz-yw), 0, 2*(xy-zw), 1-2*(xx+zz), 2*(yz+xw), 0, 2*(xz+yw), 2*(yz-xw), 1-2*(xx+yy), 0, -2*y.e23, -2*y.e13, 2*y.e12+5, 1];
        }
      // Render the given vertices. (autocreates/destroys vertex array if not supplied).  
        var draw=function(p, tp, vtx, color, color2, ratio, texc, va){
          gl.useProgram(p); gl.uniformMatrix4fv(gl.getUniformLocation(p, "mv"),false,M); 
          gl.uniformMatrix4fv(gl.getUniformLocation(p, "p"),false, [5,0,0,0,0,5*(ratio||2),0,0,0,0,1,2,0,0,-1,0])
          gl.uniform3fv(gl.getUniformLocation(p, "color"),new Float32Array(color));
          gl.uniform3fv(gl.getUniformLocation(p, "color2"),new Float32Array(color2));
          if (texc) gl.uniform1i(gl.getUniformLocation(p, "texc"),0);
          var v; if (!va) v = createVA(vtx, texc); else gl.bindVertexArray(va.r);
          gl.drawArrays(tp, 0, (va&&va.tcount)||vtx.length/3);
          if (v) destroyVA(v);
        }
      // Program for the geometry. Derivative based normals. Basic lambert shading.    
        var program = compile(`#version 300 es
                 layout (location=0) in vec4 position; out vec4 Pos; uniform mat4 mv; uniform mat4 p; 
                 void main() { gl_PointSize=6.0; Pos=mv*position; gl_Position = p*Pos; }`,
                `#version 300 es
                 precision highp float; uniform vec3 color; uniform vec3 color2; in vec4 Pos; out vec4 fragColor;
                 void main() { vec3 normal = normalize(cross(dFdx(Pos.xyz), dFdy(Pos.xyz))); float l=dot(normal,vec3(.0,-0.4,1.0));
                 fragColor = vec4(max(0.0,l)*color+color2, 1.0);  }`);
      // Create a font texture, lucida console or otherwise monospaced.
        var fw=22, font = Object.assign(document.createElement('canvas'),{width:94*fw,height:32}), 
            ctx = Object.assign(font.getContext('2d'),{font:'bold 32px lucida console, monospace'}),
            ftx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ftx);
            for (var i=33; i<127; i++) ctx.fillText(String.fromCharCode(i),(i-33)*fw,26);
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,94*fw,32,0,gl.RGBA,gl.UNSIGNED_BYTE,font);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);  
      // Font rendering program. Renders billboarded fonts, transforms offset passed as color2.
        var program2 = compile(`#version 300 es
                 layout (location=0) in vec4 position; layout (location=1) in vec2 texc; out vec2 tex; out vec4 Pos; uniform mat4 mv; uniform mat4 p; uniform vec3 color2; 
                 void main() { tex=texc; gl_PointSize=6.0; vec4 o=mv*vec4(color2,0.0); Pos=(-1.0/(o.z-5.0))*position+vec4(0.0,0.0,5.0,0.0)+o; gl_Position = p*Pos; }`,
                `#version 300 es
                 precision highp float; uniform vec3 color; in vec4 Pos; in vec2 tex; out vec4 fragColor;
                 uniform sampler2D texm; void main() { vec4 c = texture(texm,tex); if (c.a<0.01) discard; fragColor = vec4(color,c.a);}`);
      // Conformal space needs a bit extra magic to extract euclidean parametric representations.
        if (tot==5 && options.conformal) var ninf = Element.Coeff(4,1).Add(Element.Coeff(5,1)), no = Element.Coeff(4,0.5).Sub(Element.Coeff(5,0.5));
        var interprete = (x)=>{
          if (!(x instanceof Element)) return { tp:0 };
          // tp = { 0:unknown 1:point 2:line, 3:plane, 4:circle, 5:sphere
          var X2 = (x.Mul(x)).s, tp=0, weight2, opnix = ninf.Wedge(x), ipnix = ninf.Dot(x), 
              attitude, pos, normal, tg,btg,epsilon = 0.001, I3=Element.Coeff(16,-1);
          var x2zero = Math.abs(X2) < epsilon, ipnixzero = ipnix.VLength < epsilon, opnixzero = opnix.VLength < epsilon;
          if (opnixzero && ipnixzero) {                 // free flat
          } else if (opnixzero && !ipnixzero) {         // bound flat (lines)
            attitude = no.Wedge(ninf).Dot(x); 
            weight2 = Math.abs(attitude.Dot(attitude).s)**.5;
            pos = attitude.Dot(x.Reverse); //Inverse);
            pos = [-pos.e15/pos.e45,-pos.e25/pos.e45,-pos.e34/pos.e45];
            if (x.Blade(3).VLength) {
              normal = [attitude.e1/weight2,attitude.e2/weight2,attitude.e3/weight2]; tp=2; 
            } else {
              normal = Element.Dot(Element.Mul(attitude,1/weight2),I3).Normalized;
              var r=normal.Mul(Element.Coeff(3,1)); if (r[0]==-1) r[0]=1; else {r[0]+=1; r=r.Normalized;}
              tg = [...r.Mul(Element.Coeff(1,1)).Mul(r.Conjugate)].slice(1,4);
              btg = [...r.Mul(Element.Coeff(2,1)).Mul(r.Conjugate)].slice(1,4);
              normal = [...normal.slice(1,4)]; tp=3;
            }
          } else if (!opnixzero && ipnixzero) {         // dual bound flat
          } else if (x2zero) {                          // bound vec,biv,tri (points)
            attitude = ninf.Wedge(no).Dot(ninf.Wedge(x)); 
            pos = [...(Element.Dot(1/(ninf.Dot(x)).s,x)).slice(1,4)].map(x=>-x);
            tp=1; 
          } else if (!x2zero) {                          // round (point pair,circle,sphere)
            tp = x.Blade(3).VLength?4:5; 
            var nix  = ninf.Wedge(x), nix2 = (nix.Mul(nix)).s;
            attitude = ninf.Wedge(no).Dot(nix);
            pos = [...(x.Mul(ninf).Mul(x)).slice(1,4)].map(x=>-x/(2.0*nix2));
            weight2 = Math.abs((x.Dot(x)).s / nix2)**.5;
            if (tp==4) {
              if (x.Dot(x).s < 0) { weight2 = -weight2; }
              normal = Element.Dot(Element.Mul(attitude,1/weight2),I3).Normalized;
              var r=normal.Mul(Element.Coeff(3,1)); if (r[0]==-1) r[0]=1; else {r[0]+=1; r=r.Normalized;}
              tg = [...r.Mul(Element.Coeff(1,1)).Mul(r.Conjugate)].slice(1,4);
              btg = [...r.Mul(Element.Coeff(2,1)).Mul(r.Conjugate)].slice(1,4);
              normal = [...normal.slice(1,4)]; 
            } else {
              normal = [...((Element.Dot(Element.Mul(attitude,1/weight2),I3)).Normalized).slice(1,4)];
            }
          }
          return {tp,pos,normal,tg,btg,weight2}
        };                 
      // canvas update will (re)render the content.            
        var armed=0,sphere;
        canvas.update = (x)=>{
        // Start by updating canvas size if needed and viewport.
          var s = getComputedStyle(canvas); if (s.width) { canvas.width = parseFloat(s.width); canvas.height = parseFloat(s.height); }
          gl.viewport(0,0, canvas.width|0,canvas.height|0); var r=canvas.width/canvas.height;
        // Defaults, resolve function input  
          var a,p=[],l=[],t=[],c=[.5,.5,.5],lastpos=[-2,2,0.2]; gl.clear(gl.COLOR_BUFFER_BIT+gl.DEPTH_BUFFER_BIT); while (x.call) x=x();
        // Create default camera matrix and initial lastposition (contra-compensated for camera)  
          M = mtx(options.camera); lastpos = options.camera.Normalized.Conjugate.Mul(((a=new this()).set(lastpos,11),a)).Mul(options.camera.Normalized).slice(11,14);
        // Loop over all items to render.  
          for (var i=0,ll=x.length;i<ll;i++) { 
            var e=x[i]; while (e.call) e=e();
          // CGA
            if (tot==5 && options.conformal) {
              var d = interprete(e);
              if (d.tp) lastpos=d.pos;
              if (d.tp==1) p.push.apply(p,d.pos);
              if (d.tp==2) { l.push.apply(l,d.pos.map((x,i)=>x-d.normal[i]*10)); l.push.apply(l,d.pos.map((x,i)=>x+d.normal[i]*10)); }
              if (d.tp==3) { t.push.apply(t,d.pos.map((x,i)=>x+d.tg[i]+d.btg[i])); t.push.apply(t,d.pos.map((x,i)=>x-d.tg[i]+d.btg[i])); t.push.apply(t,d.pos.map((x,i)=>x+d.tg[i]-d.btg[i])); 
                             t.push.apply(t,d.pos.map((x,i)=>x-d.tg[i]+d.btg[i])); t.push.apply(t,d.pos.map((x,i)=>x+d.tg[i]-d.btg[i])); t.push.apply(t,d.pos.map((x,i)=>x-d.tg[i]-d.btg[i])); }
              if (d.tp==4) {
                var ne=0,la=0;
                if (d.weight2<0) { c[0]=1;c[1]=0;c[2]=0; }
                for (var j=0; j<65; j++) {
                  ne = d.pos.map((x,i)=>x+Math.cos(j/32*Math.PI)*d.weight2*d.tg[i]+Math.sin(j/32*Math.PI)*d.weight2*d.btg[i]); if (ne&&la&&(d.weight2>0||j%2==0)) { l.push.apply(l,la); l.push.apply(l,ne); }; la=ne;
                }
              }               
              if (d.tp==5) {
                if (!sphere) {
                  var pnts = [], tris=[], S=Math.sin, C=Math.cos, pi=Math.PI, W=96, H=48;
                  for (var j=0; j<W+1; j++) for (var k=0; k<H; k++) {
                    pnts.push( [S(2*pi*j/W)*S(pi*k/(H-1)), C(2*pi*j/W)*S(pi*k/(H-1)), C(pi*k/(H-1))]);
                    if (j && k) {
                      tris.push.apply(tris, pnts[(j-1)*H+k-1]);tris.push.apply(tris, pnts[(j-1)*H+k]);tris.push.apply(tris, pnts[j*H+k-1]);
                      tris.push.apply(tris, pnts[j*H+k-1]); tris.push.apply(tris, pnts[(j-1)*H+k]); tris.push.apply(tris, pnts[j*H+k]);
                  }}
                  sphere = { va : createVA(tris,undefined) }; sphere.va.tcount = tris.length/3;
                }
                var oldM = M;
                M=[].concat.apply([],Element.Mul([[d.weight2,0,0,0],[0,d.weight2,0,0],[0,0,d.weight2,0],[d.pos[0],d.pos[1],d.pos[2],1]],[[M[0],M[1],M[2],M[3]],[M[4],M[5],M[6],M[7]],[M[8],M[9],M[10],M[11]],[M[12],M[13],M[14],M[15]]])).map(x=>x.s);
                gl.enable(gl.BLEND); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); gl.blendColor(1,1,1,0.5); gl.enable(gl.CULL_FACE)
                draw(program,gl.TRIANGLES,undefined,c,[0,0,0],r,undefined,sphere.va);
                gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
                M = oldM;
              }
              if (i==ll-1 || d.tp==0) {
              // render triangles, lines, points.
                if (t.length) { draw(program,gl.TRIANGLES,t,c,[0,0,0],r); t.forEach((x,i)=>{ if (i%9==0) lastpos=[0,0,0]; lastpos[i%3]+=x/3; }); t=[];  }
                if (l.length) { draw(program,gl.LINES,l,[0,0,0],c,r); var l2=l.length-1; lastpos=[(l[l2-2]+l[l2-5])/2,(l[l2-1]+l[l2-4])/2+0.1,(l[l2]+l[l2-3])/2]; l=[]; }
                if (p.length) { draw(program,gl.POINTS,p,[0,0,0],c,r); lastpos = p.slice(-3); lastpos[0]-=0.075; lastpos[1]+=0.075; p=[]; }
              // setup a new color  
                if (typeof e == "number") { c[0]=((e>>>16)&0xff)/255; c[1]=((e>>>8)&0xff)/255; c[2]=(e&0xff)/255; }
                if (typeof(e)=='string') {
                  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); 
                  draw(program2,gl.TRIANGLES, 
                       [...Array(e.length*6*3)].map((x,i)=>{ var x=0,z=-0.2, o=x+(i/18|0)*1.1; return 0.25*[o,-1,z,o+1.2,-1,z,o,1,z,o+1.2,-1,z,o+1.2,1,z,o,1,z][i%18]}),c,lastpos,r,
                       [...Array(e.length*6*2)].map((x,i)=>{ var o=(e.charCodeAt(i/12|0)-33)/94; return [o,1,o+1/94,1,o,0,o+1/94,1,o+1/94,0,o,0][i%12]})); gl.disable(gl.BLEND); lastpos[1]-=0.18;
                }
              }
              continue;
            }
          // PGA   
          // Convert lines to line segments.  
            if (e instanceof Element && e.Blade(2).Length) 
               e=[e.Dot(Element.Coeff(14,1)).Wedge(e).Add(e.Wedge(Element.Coeff(1,1)).Mul(Element.Coeff(0,-500))),e.Dot(Element.Coeff(14,1)).Wedge(e).Add(e.Wedge(Element.Coeff(1,1)).Mul(Element.Coeff(0,500)))];
          // If euclidean point, store as point, store line segments and triangles.
            if (e.e123) p.push.apply(p,e.slice(11,14).map((y,i)=>(i==0?1:-1)*y/e[14]).reverse());
            if (e instanceof Array && e.length==2) l=l.concat.apply(l,e.map(x=>[...x.slice(11,14).map((y,i)=>(i==0?1:-1)*y/x[14]).reverse()])); 
            if (e instanceof Array && e.length==3) t=t.concat.apply(t,e.map(x=>[...x.slice(11,14).map((y,i)=>(i==0?1:-1)*y/x[14]).reverse()]));
          // we could also be an object with cached vertex array of triangles ..   
            if (e instanceof Object && e.data) {
              // Create the vertex array and store it for re-use.
              if (!e.va) {
                var et=[]; e.data.forEach(e=>{if (e instanceof Array && e.length==3) et=et.concat.apply(et,e.map(x=>[...x.slice(11,14).map((y,i)=>(i==0?1:-1)*y/x[14]).reverse()]));});
                e.va = createVA(et,undefined); e.va.tcount = e.data.length*3;
              }
              // render the vertex array.
              if (e.transform) { M=mtx(options.camera.Mul(e.transform)); }
              draw(program,gl.TRIANGLES,t,c,[0,0,0],r,undefined,e.va);
              if (e.transform) { M=mtx(options.camera); }
            }
          // if we're a number (color), label or the last item, we output the collected items.  
            else if (!isNaN(e) || i==ll-1 || typeof e == 'string') {
            // render triangles, lines, points.
              if (t.length) { draw(program,gl.TRIANGLES,t,c,[0,0,0],r); t.forEach((x,i)=>{ if (i%9==0) lastpos=[0,0,0]; lastpos[i%3]+=x/3; }); t=[];  }
              if (l.length) { draw(program,gl.LINES,l,[0,0,0],c,r); var l2=l.length-1; lastpos=[(l[l2-2]+l[l2-5])/2,(l[l2-1]+l[l2-4])/2+0.1,(l[l2]+l[l2-3])/2]; l=[]; }
              if (p.length) { draw(program,gl.POINTS,p,[0,0,0],c,r); lastpos = p.slice(-3); lastpos[0]-=0.075; lastpos[1]+=0.075; p=[]; }
            // setup a new color  
              if (typeof e == "number") { c[0]=((e>>>16)&0xff)/255; c[1]=((e>>>8)&0xff)/255; c[2]=(e&0xff)/255; }
            // render a label  
              if (typeof(e)=='string') {
                gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); 
                draw(program2,gl.TRIANGLES, 
                     [...Array(e.length*6*3)].map((x,i)=>{ var x=0,z=-0.2, o=x+(i/18|0)*1.1; return 0.25*[o,-1,z,o+1.2,-1,z,o,1,z,o+1.2,-1,z,o+1.2,1,z,o,1,z][i%18]}),c,lastpos,r,
                     [...Array(e.length*6*2)].map((x,i)=>{ var o=(e.charCodeAt(i/12|0)-33)/94; return [o,1,o+1/94,1,o,0,o+1/94,1,o+1/94,0,o,0][i%12]})); gl.disable(gl.BLEND); lastpos[1]-=0.18;
              }
            }  
          }; 
          // if we're no longer in the page .. stop doing the work.
          armed++; if (document.body.contains(canvas)) armed=0; if (armed==2) return;
          if (options&&options.animate) requestAnimationFrame(canvas.update.bind(canvas,f,options));  
        }
        return requestAnimationFrame(canvas.update.bind(canvas,f,options)),canvas;
      }  
    
    // The inline function is a js to js translator that adds operator overloading and algebraic literals.
    // It can be called with a function, a string, or used as a template function.  
      static inline(intxt) {
      // If we are called as a template function. 
        if (arguments.length>1 || intxt instanceof Array) {
          var args=[].slice.call(arguments,1);
          return res.inline(new Function(args.map((x,i)=>'_template_'+i).join(),'return ('+intxt.map((x,i)=>(x||'')+(args[i]&&('_template_'+i)||'')).join('')+')')).apply(res,args);
        }
      // Get the source input text.    
        var txt = (intxt instanceof Function)?intxt.toString():`function(){return (${intxt})}`;
      // Our tokenizer reads the text token by token and stores it in the tok array (as type/token tuples).   
        var tok = [], resi=[], t, tokens = [/^[\s\uFFFF]|^[\u000A\u000D\u2028\u2029]|^\/\/[^\n]*\n|^\/\*[\s\S]*?\*\//g,                 // 0: whitespace/comments
          /^\"\"|^\'\'|^\".*?[^\\]\"|^\'.*?[^\\]\'|^\`[\s\S]*?[^\\]\`/g,                                                                // 1: literal strings
          /^\d+[.]{0,1}\d*[ei][\+\-_]{0,1}\d*|^\.\d+[ei][\+\-_]{0,1}\d*|^e_\d*/g,                                                       // 2: literal numbers in scientific notation (with small hack for i and e_ asciimath)
          /^\d+[.]{0,1}\d*[E][+-]{0,1}\d*|^\.\d+[E][+-]{0,1}\d*|^0x\d+|^\d+[.]{0,1}\d*|^\.\d+|^\(\/.*[^\\]\/\)/g,                       // 3: literal hex, nonsci numbers and regex (surround regex with extra brackets!)
          /^(\.Normalized|\.Length|\.\.\.|>>>=|===|!==|>>>|<<=|>>=|=>|[<>\+\-\*%&|^\/!\=]=|\*\*|\+\+|\-\-|<<|>>|\&\&|\^\^|^[{}()\[\];.,<>\+\-\*%|&^!~?:=\/]{1})/g,   // 4: punctuator
          /^[A-Za-z0-9_]*/g]                                                                                                            // 5: identifier
        while (txt.length) for(t in tokens) if(resi=txt.match(tokens[t])){ tok.push([t|0,resi[0]]); txt=txt.slice(resi[0].length); break;} // tokenise 
      // Translate algebraic literals. (scientific e-notation to "this.Coeff"
        tok=tok.map(t=>(t[0]==2)?[2,'Element.Coeff('+basis.indexOf('e'+(t[1].split(/e_|e|i/)[1]||1))+','+parseFloat(t[1][0]=='e'?1:t[1].split(/e_|e|i/)[0])+')']:t);
      // We support two syntaxes, standard js or if you pass in a text, asciimath.       
        var syntax = (intxt instanceof Function)?[[['.Normalized','Normalize',2],['.Length','Length',2],['.','.',3]],[['~','Conjugate',1],['!','Dual',1]],[['**','Pow',0,1]],[['>>>','sw',0,1],['^','Wedge'],['&','Vee'],['<<','Dot']],[['*','Mul'],['/','Div']],[['-','Sub'],['+','Add']],[['<','lt'],['>','gt'],['<=','lte'],['>=','gte']]]
                                                :[[['pi','Math.PI'],['sin','Math.sin']],[['ddot','this.Reverse'],['tilde','this.Involute'],['hat','this.Conjugate'],['bar','this.Dual']],[['^','Pow',0,1]],[['^^','Wedge'],['*','Dot']],[['**','Mul'],['/','Div']],[['-','Sub'],['+','Add']],[['<','lt'],['>','gt'],['<=','lte'],['>=','gte']]];
      // For asciimath, some fixed translations apply (like pi->Math.PI) etc ..                                          
        tok=tok.map(t=>(t[0]!=5)?t:[].concat.apply([],syntax).filter(x=>x[0]==t[1]).length?[5,[].concat.apply([],syntax).filter(x=>x[0]==t[1])[0][1]]:t); 
      // Now the token-stream is translated recursively.    
        function translate(tokens) { 
           var resi=[], isTok=(x,t)=>{while(x>0 && resi[x][0]==0)x--; return resi[x][0]==t}; 
           for (var i=0,t; i<tokens.length; i++)
           // recurse round brackets
             if ((t=tokens[i])[1] == '(') { var open=1,sub=[],pre=[]; while(resi.length && (resi[resi.length-1][0]==5 || resi[resi.length-1][1]=='.')) pre.unshift(resi.pop()[1]);  while (open) { t = tokens[++i]; if (t[1] == '(') open++; else if (t[1] == ')') open--; if (open) sub.push(t); }; resi.push([[2,pre.join('')+'(']].concat(translate(sub)).concat([[2,')']])); }
           // recurse square brackets  
             else if ((t=tokens[i])[1] == '[') { var open=1,sub=[],pre=[]; while(resi.length && (isTok(resi.length-1,5) || isTok(resi.length-1,2) || resi[resi.length-1][1]=='.')) pre.unshift(resi.pop()[1]);  while (open) { t = tokens[++i]; if (t[1] == '[') open++; else if (t[1] == ']') open--; if (open) sub.push(t); }; resi.push([[2,pre.join('')+'[']].concat(translate(sub)).concat([[2,']']])); }
           // Unary operators.  
             else if (~'~!'.indexOf(t[1])) { resi.push(t); var sub=[], open=0; while (~'~!-'.indexOf(t[1]) || open) { t=tokens[++i]; if (t[1] == '(') open++; else if (t[1] == ')') open--; sub.push(t); }; resi.push([[2,'']].concat(translate(sub))); }
             else if (t[1]=='-'&&resi.length&&(isTok(resi.length-1,4) || resi[resi.length-1][1]=='return'|| (resi[resi.length-1][0]==0 && resi[resi.length-2][1]=='return'))) { resi.push([[2,'']].concat(translate([t,tokens[++i]])))  }
             else resi.push(t);  
           // glue array indexing and function calls. (hacky)  
           for (var c=[],last=0,i=0; i<resi.length; i++) if (resi[i][0][0]!=2 || !/[\[\(]/.test(resi[i][0][1][0])) { last=0; c.push(resi[i]); } else if (last) last.push(resi[i]); else if (resi[i+1] && resi[i+1][0][0]==2 && /[\[\(]/.test(resi[i+1][0][1][0])) c.push(last=[resi[i]]); else c.push(resi[i]); resi=c;
           // Now go over all operators in the syntax, in order of precedence.
           syntax.forEach((syntaxd,k)=>{ var ops=syntaxd.map(x=>x[0]);
            // For operators of equal precedence, go either right to left or left to right.   
            syntaxd.forEach( (op)=>{ tokens=resi;resi=[]; // now translate ops ..
            // right-to-left, loop over all tokens.
              if (op[3]) { 
                for (var i=tokens.length-1;  i >= 0; i--) { 
                // if we find our token
                  if (tokens[i][1] == op[0]) {
                  // eat whitespace around operators.
                    while(resi.length&&resi[resi.length-1][1].match&&resi[resi.length-1][1].match(/^\s+$/)) resi.pop();
                  // Find token to the right.  
                    if (!op[2]) var after=tokens[i-1]; while (after[1].match&&after[1].match(/^\s+$/)) after = tokens[--i-1];
                  // Find token to the left and concat.  
                    if (op[2]||!resi.length||resi[resi.length-1][0]==4) resi[resi.length]=[[1,'Element.'+op[1]+'('],resi[resi.length-1],[1,')']]; else resi[resi.length-1]=[[1,'Element.'+op[1]+'('],after,[1,','],resi[resi.length-1],[1,')']];
                  // Skip the token itself.  
                    i -= 1; 
                  // if not found, hold for next precedence loop.  
                  } else resi.push(tokens[i]); 
                }
                resi=resi.reverse(); // because of rtl
            // left to right, loop over all tokens.     
              } else { 
                for (var i=0; i<tokens.length; i++) { 
                // if we find our operator.
                  if (ops.indexOf(tokens[i][1]) != -1) { 
                  // Get operator
                    op = syntaxd.filter(x=>x[0]==tokens[i][1])[0];
                  // kill spaces around operator.  
                    if (op[2]!=1) while(resi.length&&resi[resi.length-1][1].match&&resi[resi.length-1][1].match(/^\s+$/)) resi.pop();
                  // Collect second argument.
                    if (op[2]!=2) { var after=tokens[i+1]; while (after[1].match&&after[1].match(/^\s+$/)) after = tokens[++i+1]; }
                  // Concat dot operator as complete identifier.  
                    if (op[2]==3) resi[resi.length-1]=[resi[resi.length-1],[1,'.'],after];
                  // Support for properties on literals etc..  
                    else if (op[2]==2) resi[resi.length-1]=[[1,'Element.'+op[1]+'('],resi[resi.length-1],[1,')']];
                  // Translate current operator.  
                    else if (op[2]||!resi.length||resi[resi.length-1][0]==4) resi[resi.length]=[[1,'Element.'+op[1]+'('],after,[1,')']]; else resi[resi.length-1]=[[1,'Element.'+op[1]+'('],resi[resi.length-1],[1,','],after,[1,')']];
                  // Skip operator.  
                    if (op[2]!=2) i += 1; 
                  // Not found, keep for next precedence loop.  
                  } else resi.push(tokens[i]); 
                }
              }
           });}); 
           return resi;
        }
      // Glue all back together and return as bound function.  
        return eval('('+(function f(t){return t.map(t=>t[0]instanceof Array?f(t):t[1]).join('');})(translate(tok))+')');
      }
    }
    
  // Convert symbolic matrices to code. (skipping zero's on dot and wedge matrices).
  // These all do straightforward string fiddling. If the 'mix' option is set they reference basis components using e.g. '.e1' instead of eg '[3]' .. so that
  // it will work for elements of subalgebras etc.
    res.prototype.Add   = new Function('b,res','res=res||new this.constructor();\n'+basis.map((x,xi)=>'res['+xi+']=b['+xi+']+this['+xi+']').join(';\n').replace(/(b|this)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a)+';\nreturn res')
    res.prototype.Sub   = new Function('b,res','res=res||new this.constructor();\n'+basis.map((x,xi)=>'res['+xi+']=this['+xi+']-b['+xi+']').join(';\n').replace(/(b|this)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a)+';\nreturn res')
    res.prototype.Mul   = new Function('b,res','res=res||new this.constructor();\n'+gp.map((r,ri)=>'res['+ri+']='+r.join('+').replace(/\+\-/g,'-').replace(/(\w*?)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a).replace(/\+0/g,'')+';').join('\n')+'\nreturn res;');
    res.prototype.Dot   = new Function('b,res','res=res||new this.constructor();\n'+cp.map((r,ri)=>'res['+ri+']='+r.join('+').replace(/\+\-/g,'-').replace(/\+0/g,'').replace(/(\w*?)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a)+';').join('\n')+'\nreturn res;');
    res.prototype.Wedge = new Function('b,res','res=res||new this.constructor();\n'+op.map((r,ri)=>'res['+ri+']='+r.join('+').replace(/\+\-/g,'-').replace(/\+0/g,'').replace(/(\w*?)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a)+';').join('\n')+'\nreturn res;');
    res.prototype.Vee   = new Function('b,res','res=res||new this.constructor();\n'+op.map((r,ri)=>'res['+drm[ri]+']='+r.map(x=>x.replace(/\[(.*?)\]/g,function(a,b){return '['+(drm[b|0])+']'})).join('+').replace(/\+\-/g,'-').replace(/\+0/g,'').replace(/(\w*?)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a)+';').join('\n')+'\nreturn res;');

  // Add getter and setters for the basis vectors/bivectors etc .. 
    basis.forEach((b,i)=>{res.prototype.__defineGetter__(i?b:'s',function(){ return this[i] }); }); 
    basis.forEach((b,i)=>{res.prototype.__defineSetter__(i?b:'s',function(x){ this[i]=x; }); });
    
  // Reversion, Involutions, Conjugation for any number of grades, component acces shortcuts.
    res.prototype.__defineGetter__('Negative', function(){ var res = new this.constructor(); for (var i=0; i<this.length; i++) res[i]= -this[i]; return res; });
    res.prototype.__defineGetter__('Reverse',  function(){ var res = new this.constructor(); for (var i=0; i<this.length; i++) res[i]= this[i]*[1,1,-1,-1][grades[i]%4]; return res; });
    res.prototype.__defineGetter__('Involute', function(){ var res = new this.constructor(); for (var i=0; i<this.length; i++) res[i]= this[i]*[1,-1,1,-1][grades[i]%4]; return res; });
    res.prototype.__defineGetter__('Conjugate',function(){ var res = new this.constructor(); for (var i=0; i<this.length; i++) res[i]= this[i]*[1,-1,-1,1][grades[i]%4]; return res; });
  
  // The Dual, Length, non-metric length and normalized getters.  
    res.prototype.__defineGetter__('Dual',function(){ if (r) return this.map((x,i,a)=>a[drm[i]]*drms[i]); var res = new this.constructor(); res[res.length-1]=1; return res.Mul(this); });
    res.prototype.__defineGetter__('Length',  function(){  return Math.sqrt(Math.abs(this.Mul(this.Conjugate).s)); }); 
    res.prototype.__defineGetter__('VLength',  function(){ var res = 0; for (var i=0; i<this.length; i++) res += this[i]*this[i]; return Math.sqrt(res); });
    res.prototype.__defineGetter__('Normalized', function(){ var res = new this.constructor(),l=this.Length; if (!l) return this; l=1/l; for (var i=0; i<this.length; i++) res[i]=this[i]*l; return res; });
    
  // Matrix-free inverses up to 5D. Should translate this to an inline call for readability.
  // http://repository.essex.ac.uk/17282/1/TechReport_CES-534.pdf  
    res.prototype.__defineGetter__('Inverse', function(){  
      return (tot==0)?new this.constructor.Scalar([1/this[0]]):
             (tot==1)?this.Involute.Mul(this.constructor.Scalar(1/this.Mul(this.Involute)[0])):
             (tot==2)?this.Conjugate.Mul(this.constructor.Scalar(1/this.Mul(this.Conjugate)[0])):
             (tot==3)?this.Reverse.Mul(this.Involute).Mul(this.Conjugate).Mul( this.constructor.Scalar(1/this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse)[0])):
             (tot==4)?this.Conjugate.Mul(this.Mul(this.Conjugate).Map(3,4)).Mul( this.constructor.Scalar(1/this.Mul(this.Conjugate).Mul(this.Mul(this.Conjugate).Map(3,4))[0])):
                      this.Conjugate.Mul(this.Involute).Mul(this.Reverse).Mul(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Map(1,4)).Mul(this.constructor.Scalar(1/this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Mul(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Map(1,4))[0]));
    });
    
  // If a function was passed in, translate, call and return its result. Else just return the Algebra.  
    if (fu instanceof Function) return res.inline(fu)(); else return res;  
  }
}));
