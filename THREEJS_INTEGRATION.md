# Three.js Integration for Ganja.js

This document describes the Three.js integration added to Ganja.js for enhanced 3D visualization capabilities.

## Overview

The Three.js integration provides an alternative rendering path for 3D geometric algebra visualizations, offering:

- **Custom Materials**: Multiple material types including Phong, Standard (PBR), Lambert, and Basic
- **Advanced Lighting**: Ambient, directional, and point lights with shadow mapping support
- **Smooth Animations**: Built-in animation loop support with camera controls
- **Better Performance**: Leverages Three.js optimizations for WebGL rendering
- **Fallback Support**: Automatically falls back to standard WebGL if Three.js is unavailable

## Installation

### Using npm (recommended)

```bash
npm install three
```

### Using CDN

Include Three.js before ganja.js in your HTML:

```html
<script src="https://unpkg.com/three@0.159.0/build/three.min.js"></script>
<script src="ganja.js"></script>
```

## Usage

### Basic Example

To enable Three.js rendering, simply add `useThree: true` to your graph options:

```javascript
Algebra(3, 0, 1, () => {
  var point = (x, y, z) => !(1e0 + x*1e1 + y*1e2 + z*1e3);
  
  document.body.appendChild(this.graph(() => {
    return [
      0xff0000, point(1, 0, 0),
      0x00ff00, point(0, 1, 0),
      0x0000ff, point(0, 0, 1)
    ];
  }, {
    useThree: true,  // Enable Three.js renderer
    animate: true,
    grid: true
  }));
});
```

## Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useThree` | boolean | `false` | Enable Three.js renderer |
| `animate` | boolean | `false` | Enable animation loop |
| `width` | string | `'100%'` | Canvas width |
| `height` | string | `'100%'` | Canvas height |

### Camera Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fov` | number | `75` | Field of view in degrees |
| `z` | number | `5` | Camera distance from origin |
| `h` | number | `0` | Horizontal rotation angle |
| `p` | number | `0` | Vertical rotation angle (pitch) |
| `posx` | number | `0` | Camera X position offset |
| `posy` | number | `0` | Camera Y position offset |
| `posz` | number | `0` | Camera Z position offset |

### Lighting Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lights` | boolean | `true` | Enable lighting system |
| `ambientColor` | hex | `0xffffff` | Ambient light color |
| `ambientIntensity` | number | `0.4` | Ambient light intensity |
| `directionalColor` | hex | `0xffffff` | Directional light color |
| `directionalIntensity` | number | `0.6` | Directional light intensity |
| `pointLight` | boolean | `false` | Enable point light |
| `pointLightColor` | hex | `0xffffff` | Point light color |
| `pointLightIntensity` | number | `0.5` | Point light intensity |
| `pointLightX/Y/Z` | number | `0/5/0` | Point light position |
| `shadowMap` | boolean | `true` | Enable shadow mapping |

### Material Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `materialType` | string | `'phong'` | Material type: 'phong', 'standard', 'lambert', 'basic' |
| `shininess` | number | `30` | Phong material shininess |
| `metalness` | number | `0.1` | Standard material metalness |
| `roughness` | number | `0.5` | Standard material roughness |
| `doubleSided` | boolean | `false` | Render both sides of surfaces |

### Grid Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `grid` | boolean | `false` | Show grid helper |
| `gridSize` | number | `10` | Grid size |
| `gridDivisions` | number | `10` | Number of grid divisions |
| `gridColorCenter` | hex | `0x888888` | Center line color |
| `gridColorGrid` | hex | `0xcccccc` | Grid line color |

### Rendering Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pointRadius` | number | `0.05` | Radius for point rendering |
| `pointSegments` | number | `16` | Segments for point spheres |
| `lineWidth` | number | `1` | Line width (note: limited support in WebGL) |
| `backgroundColor` | hex | `0xf0f0f0` | Scene background color |
| `antialias` | boolean | `true` | Enable antialiasing |
| `controls` | boolean | `true` | Enable mouse controls |
| `responsive` | boolean | `true` | Resize with window |

## Supported Geometric Elements

### PGA3D (Projective Geometric Algebra)

- **Points**: Rendered as spheres
- **Lines**: Rendered as line segments
- **Planes**: Rendered as semi-transparent quads
- **Arrays**: Lines connecting multiple points or polygon meshes

### CGA3D (Conformal Geometric Algebra)

- **Points**: Rendered as spheres
- **Spheres**: Rendered with proper radius and transparency
- **Circles**: Rendered as ring geometry
- **Lines**: Line segments between points
- **Point pairs**: Two points from intersection results

## Examples

### PGA3D: Animated Rotors

See `examples/example_threejs_pga3d_animated_rotors.html` for a complete example showing:
- Animated rotation of points around different axes
- Custom Phong materials with specular highlights
- Multiple light sources with shadows
- Interactive camera controls

### CGA3D: Animated Scene

See `examples/example_threejs_cga3d_animated_scene.html` for a complete example showing:
- Orbiting points in conformal space
- Standard PBR materials for realistic rendering
- Dynamic color gradients
- Multiple light sources

## Mouse Controls

When `controls: true` (default):

- **Left Mouse Drag**: Rotate camera around origin
- **Right Mouse Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Right Click**: Disabled (no context menu)

## Advanced Usage

### Custom Animation Callback

```javascript
this.graph(() => {
  // Your scene data
}, {
  useThree: true,
  animate: true,
  onAnimate: (scene, camera, renderer) => {
    // Custom per-frame logic
    // Access scene, camera, renderer directly
  }
});
```

### Accessing Three.js Objects

The returned container has references to Three.js objects:

```javascript
var container = this.graph(data, { useThree: true });

// Access Three.js internals
console.log(container.scene);     // THREE.Scene
console.log(container.camera);    // THREE.PerspectiveCamera
console.log(container.renderer);  // THREE.WebGLRenderer
console.log(container.canvas);    // HTMLCanvasElement
```

### Material Customization

Different material types offer different visual qualities:

```javascript
// Phong: Good balance, specular highlights
{ materialType: 'phong', shininess: 50 }

// Standard: PBR materials, most realistic
{ materialType: 'standard', metalness: 0.3, roughness: 0.4 }

// Lambert: Matte surfaces, no specular
{ materialType: 'lambert' }

// Basic: Unlit, flat shading
{ materialType: 'basic' }
```

## Performance Tips

1. **Use appropriate point segments**: Lower `pointSegments` for better performance
2. **Disable shadows** when not needed: `shadowMap: false`
3. **Limit lights**: Each light has performance cost
4. **Use simpler materials**: `lambert` or `basic` are faster than `standard`
5. **Disable antialiasing** on low-end devices: `antialias: false`

## Browser Compatibility

Requires browsers with WebGL support:
- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

## Fallback Behavior

If Three.js is not available:
1. Console warning is logged
2. Automatically falls back to standard `graphGL()` renderer
3. No error thrown, seamless degradation

## Known Limitations

- Text labels not yet implemented in Three.js renderer
- Line width support is limited in WebGL (browser-dependent)
- Some complex GA operations may not render correctly
- Motor orbits and particle systems use standard renderer

## Migration from Standard Renderer

To migrate existing code:

1. Include Three.js library
2. Add `useThree: true` to options
3. Optionally adjust material and lighting options
4. Test and tune performance settings

Most existing code should work without changes!

## Contributing

To add support for new geometric elements:

1. Update the `interprete()` function in `graphGL3JS()`
2. Add rendering logic in the `render()` function
3. Add example demonstrating the new feature
4. Update this documentation

## License

Same as Ganja.js (MIT License)
