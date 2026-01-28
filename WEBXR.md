# WebXR Support for Ganja.js

Ganja.js now includes WebXR support for rendering geometric algebra visualizations in Augmented Reality (AR) and Virtual Reality (VR).

## Features

- **AR Mode**: Place geometric algebra objects in the real world using AR hit-testing
- **VR Mode**: Explore 3D geometric scenes in immersive virtual reality
- **Automatic Fallback**: Gracefully degrades to regular 3D rendering on non-XR devices
- **Easy Integration**: Simple API that extends the existing `graph()` function

## Usage

### Basic WebXR Setup

Use the `graphXR()` method instead of `graph()`:

```javascript
Algebra(3,0,1,()=>{
  // Your geometric algebra code here
  var point = (x,y,z)=>!(1e0 + x*1e1 + y*1e2 + z*1e3);
  
  // Create scene
  var scene = () => {
    return [
      0x00AAFF,
      point(0, 0, 0),
      // ... more objects
    ];
  };
  
  // Render in AR or VR
  document.body.appendChild(this.graphXR(scene, {
    xr: 'ar',  // or 'vr'
  }));
});
```

### AR Mode with Hit-Testing

```javascript
var hitPoseMatrix = null;
var placedObjects = [];

var onHitTest = (hitPose, sceneData) => {
  // Always check if hitPose is valid
  if (hitPose && hitPose.transform && hitPose.transform.matrix) {
    hitPoseMatrix = hitPose.transform.matrix;
    // hitPose contains the position where the AR reticle is pointing
    // sceneData is the current scene array, can be used to update objects
  }
};

document.body.appendChild(this.graphXR(generateScene, {
  xr: 'ar',
  onHitTest: onHitTest,
  lineWidth: 3,
  pointRadius: 1.5,
}));

// Place object on tap/click
document.addEventListener('click', () => {
  if (hitPoseMatrix) {
    var x = hitPoseMatrix[12];
    var y = hitPoseMatrix[13];
    var z = hitPoseMatrix[14];
    placedObjects.push(createObjectAt([x, y, z]));
  }
});
```

### VR Mode

```javascript
document.body.appendChild(this.graphXR(generateScene, {
  xr: 'vr',
  animate: true,  // Enable animation loop
  lineWidth: 3,
  pointRadius: 2,
}));
```

## Options

The `graphXR()` method accepts the same options as `graph()`, plus:

- **xr**: `'ar'` or `'vr'` - Select AR or VR mode
- **onHitTest**: `function(hitPose, sceneData)` - Callback for AR hit-testing (AR mode only)

## Browser Support

WebXR requires:
- **AR**: Chrome on Android 8.0+ with ARCore support
- **VR**: Chrome, Edge, or Firefox with WebXR support and a VR headset

On unsupported browsers, the examples automatically fall back to regular 3D rendering.

## Examples

See the following examples:
- `examples/example_pga3d_ar_placement.html` - AR object placement demo
- `examples/example_pga3d_vr_scene.html` - VR immersive scene demo

## Technical Details

### How It Works

1. Creates an XR-compatible WebGL context
2. Adds an "Enter AR/VR" button to the UI
3. When activated, requests a WebXR session
4. Renders the scene using XR view/projection matrices
5. Handles hit-testing for AR object placement
6. Supports stereo rendering for VR headsets

### Current Limitations

- Full camera matrix integration is in progress
- Some advanced rendering features may not work in XR mode
- Hit-test results depend on device capabilities

## Future Enhancements

Planned improvements:
- Full integration of XR pose data with camera matrices
- XR controller visualization and interaction
- Hand tracking support
- More AR interaction modes (scaling, rotation)
